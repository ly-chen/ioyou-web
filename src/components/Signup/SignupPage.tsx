import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Form, InputGroup, FormControl } from 'react-bootstrap'
import styles from './Signup.module.css'
import { AnyCnameRecord } from 'dns';

const SignupPage: React.FC = () => {

    const [validated, setValidated] = useState<boolean>(false);
    const [name, setName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [repassword, setRepassword] = useState<string>('')

    const handleSubmit = (event: any) => {
        console.log('name = ', name)
        console.log('email = ', email)
        console.log('password = ', password)
        console.log(event.currentTarget)
        if (event.currentTarget.checkValidity() === false) {
            console.log(validated);
            event.preventDefault();
            event.stopPropagation();
        } else {
            setValidated(true);

        }
        console.log(validated);
    }


    const handleChangeName = (event: any) => {
        setName(event.target.value)
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
                <Nav className='ml-auto'></Nav>
                <Button variant="outline-dark">
                    log in
                        </Button>
            </Navbar>
            <Container className={styles.paddingTop}>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control required type="email" placeholder="Enter email" onChange={handleChangeEmail} value={email} />
                        <Form.Text className="text-muted">
                            We'll never share your email with anyone else.
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            Please provide an email.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control required type="password" placeholder="Password" onChange={handleChangePassword} value={password} />
                        <Form.Control.Feedback type="invalid">
                            Please provide a password.
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group controlId="formBasicCheckbox">
                        <Form.Check required type="checkbox" label="I agree to the terms and conditions." />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Submit
                    </Button>
                </Form>
            </Container>
        </div>
    )
}

export { SignupPage }