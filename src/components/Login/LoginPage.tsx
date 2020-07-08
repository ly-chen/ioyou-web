import React, { useState } from 'react';
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Form, InputGroup, FormControl } from 'react-bootstrap'
import { useFirebase, Firebase } from '../Firebase'
import styles from './Login.module.css'

const LoginPage: React.FC = () => {
    const firebase = useFirebase()

    const [validated, setValidated] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [err, setErr] = useState<string>('')

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        console.log('email = ', email)
        console.log('password = ', password)
        console.log(event.currentTarget)
        if (event.currentTarget.checkValidity() === false) {
            console.log(validated);
            event.preventDefault();
            event.stopPropagation();
        } else {
            try {
                await firebase.doSignInWithEmailAndPassword(email, password)
                setValidated(true);
                window.location.href = "/"
            } catch (e) {
                console.log(e);
                setErr(e.message);
            }
        }
        console.log(validated);
    }

    const handleChangeEmail = (event: any) => {
        setEmail(event.target.value)
    }

    const handleChangePassword = (event: any) => {
        setPassword(event.target.value)
    }

    return (
        <div>
            <Navbar bg="light" variant="light">
                <Navbar.Brand href="/">
                    {' '}
                            ioyou
                    </Navbar.Brand>
                <Nav className='ml-auto'>
                    <Button variant="outline-dark" href="/signup">
                        sign up
                    </Button>
                </Nav>

            </Navbar>
            <Container className={styles.paddingTop}>
                <Form validated={validated} onSubmit={handleSubmit}>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control required type="email" placeholder="Enter email" onChange={handleChangeEmail} value={email} />
                    </Form.Group>
                    <Form.Group controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control required type="password" placeholder="Password" onChange={handleChangePassword} value={password} />
                    </Form.Group>
                    <Button variant="primary" type="submit" style={{ marginTop: 10 }}>
                        Log in
                    </Button>
                </Form>
                <p className="text-danger">{err}</p>
            </Container>
        </div>
    )
}

export { LoginPage }