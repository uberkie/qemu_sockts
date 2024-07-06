import { useEffect, useState } from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { WaveSocketClient } from 'wave-socket-client';

const VMManagementComponent = () => {
    const [vms, setVms] = useState([]);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        fetchVms(); // Fetch initial VMs on mount

        // Initialize Wave Socket connection
        const waveSocket = new WaveSocketClient('wss://192.168.111.142/ws');
        setSocket(waveSocket);

        waveSocket.on('connect', () => {
            console.log('Wave Socket connected');
        });

        waveSocket.on('vm_created', handleVmCreated);
        waveSocket.on('vm_status_updated', handleVmStatusUpdated);

        waveSocket.on('disconnect', () => {
            console.log('Wave Socket disconnected');
        });

        waveSocket.on('error', (error) => {
            console.error('Wave Socket error', error);
            showError('WebSocket connection error');
        });

        return () => {
            waveSocket.close();
        };
    }, []);

    const fetchVms = async () => {
        try {
            const response = await fetch('/api/vms');
            const data = await response.json();
            setVms(data);
        } catch (error) {
            console.error('Failed to fetch VMs', error);
            setError('Failed to fetch VMs');
        }
    };

    const updateVMStatus = async (name, newStatus) => {
        try {
            await fetchVms(); // Fetch the latest VMs data

            const vm = vms.find(vm => vm.name === name);
            if (!vm) {
                showError('VM not found');
                return;
            }

            const normalizedStatus = newStatus.toLowerCase();
            if ((vm.state === 1 && normalizedStatus === 'start') ||
                ((vm.state === 4 || vm.state === 5) && (normalizedStatus === 'shutdown' || normalizedStatus === 'poweroff'))) {
                showError(`VM is already ${getStateMessage(vm.state)}`);
                return;
            }

            await performAction(normalizedStatus, vm);

            setVms(prevVms => prevVms.map(vm => vm.name === name ? { ...vm, status: newStatus } : vm));
        } catch (error) {
            console.error("Error updating VM status", error);
            showError('Failed to update VM status');
        }
    };

    const performAction = async (action, vm) => {
        try {
            await fetch(`/api/vms/${vm.id}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            });
        } catch (error) {
            console.error('Failed to perform action', error);
            showError('Failed to perform action');
        }
    };

    const getStateMessage = (state) => {
        switch (state) {
            case 1:
                return 'running';
            case 4:
            case 5:
                return 'poweroff';
            default:
                return 'unknown';
        }
    };

    const showError = (message) => {
        setError(message);
        setTimeout(() => setError(null), 3000);
    };

    const handleVmCreated = (newVm) => {
        setVms(prevVms => [...prevVms, newVm]);
    };

    const handleVmStatusUpdated = ({ name, status }) => {
        setVms(prevVms => prevVms.map(vm => vm.name === name ? { ...vm, status } : vm));
    };

    const renderVMGrid = () => (
        <Row className="mt-4">
            {vms.map(vm => (
                <Col key={vm.id} md={4} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>{vm.name}</Card.Title>
                            <Card.Text><strong>Status:</strong> <span className={`vm-status status-${vm.state}`}>{getStateMessage(vm.state)}</span></Card.Text>
                            <Card.Text><strong>CPU:</strong> {vm.vcpus} cores</Card.Text>
                            <Card.Text><strong>RAM:</strong> {(vm.memory / 1024 / 1024).toFixed(2)} GB</Card.Text>
                            <div className="vm-actions">
                                {getStateMessage(vm.state) === 'running' ? (
                                    <>
                                        <Button variant="primary" size="sm" onClick={() => console.log(`Connecting to VM ${vm.name}`)}>Connect</Button>{' '}
                                        <Button variant="warning" size="sm" onClick={() => updateVMStatus(vm.name, 'PAUSED')}>Pause</Button>{' '}
                                        <Button variant="danger" size="sm" onClick={() => updateVMStatus(vm.name, 'poweroff')}>Power Off</Button>
                                    </>
                                ) : getStateMessage(vm.state) === 'poweroff' ? (
                                    <>
                                        <Button variant="success" size="sm" onClick={() => updateVMStatus(vm.name, 'start')}>Start</Button>{' '}
                                        <Button variant="primary" size="sm" onClick={() => console.log(`Editing VM ${vm.name}`)}>Edit</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="success" size="sm" onClick={() => updateVMStatus(vm.name, 'start')}>Start</Button>{' '}
                                        <Button variant="danger" size="sm" onClick={() => updateVMStatus(vm.name, 'poweroff')}>Power Off</Button>
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );

    return (
        <div>
            {error && <div className="error">{error}</div>}
            {renderVMGrid()}
        </div>
    );
};

export default VMManagementComponent;
