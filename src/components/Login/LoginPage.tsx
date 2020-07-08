import React from 'react';
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Form, InputGroup, FormControl } from 'react-bootstrap'
import styles from './Login.module.css'

const LoginPage: React.FC = () => {

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
                <Form>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control type="email" placeholder="Enter email" />
                    </Form.Group>
                    <Form.Group controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" placeholder="Password" />
                    </Form.Group>
                    <Button variant="primary" type="submit" style={{ marginTop: 10 }}>
                        Log in
                    </Button>
                </Form>
            </Container>
        </div>
    )
}

export { LoginPage }