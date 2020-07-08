import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Form, OverlayTrigger, Popover } from 'react-bootstrap'
import styles from './Signup.module.css'
import { auth, firestore } from 'firebase'
import { AnyCnameRecord } from 'dns';

const SignupPage: React.FC = () => {

    const [validated, setValidated] = useState<boolean>(false);
    const [name, setName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [err, setErr] = useState<string>('')
    const [passCheck, setPassCheck] = useState<boolean>(false);

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        console.log('name = ', name)
        console.log('email = ', email)
        console.log('password = ', password)
        console.log(event.currentTarget)
        if (event.currentTarget.checkValidity() === false || passCheck === false) {
            console.log(validated);
            event.preventDefault();
            event.stopPropagation();
        } else {
            try {
                await auth().createUserWithEmailAndPassword(email, password).then(async (newUser) => {
                    await firestore().collection('users').doc(newUser?.user?.uid).set({ name: name, email: email });
                })
                setValidated(true);
                window.location.href = "/"
            } catch (e) {
                console.log(e);
                setErr(e.message);
            }
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
        var check = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,30}$/;
        setPassword(event.target.value);
        if (event.target.value.match(check)) {
            setPassCheck(true);
            console.log('passCheck')
        } else {
            setPassCheck(false);
            console.log('failCheck')
        }
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
                <Form validated={validated} onSubmit={handleSubmit}>

                    <Form.Group controlId="formBasicName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control required type="text" placeholder="Jane Doe" onChange={handleChangeName} value={name} />
                        <Form.Text className="text-muted">
                            You can pick a username later.
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            Please provide an email.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control required type="email" placeholder="jdoe@email.com" onChange={handleChangeEmail} value={email} />
                        <Form.Control.Feedback type="invalid">
                            Please provide an email.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control required type="password" placeholder="Password" onChange={handleChangePassword} value={password} />
                        {passCheck ?
                            <Form.Text className="text-success">
                                Looks good!
                            </Form.Text>
                            :
                            <Form.Text className="text-danger">
                                At least 8 characters and contain an uppercase letter, lowercase letter, number, and special character.
                            </Form.Text>
                        }
                    </Form.Group>
                    <Form.Group controlId="formBasicCheckbox">
                        <Form.Check required type="checkbox" label="I agree to the terms and conditions." />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Submit
                    </Button>
                </Form>
                <p className="text-danger">{err}</p>
            </Container>
        </div>
    )
}

export { SignupPage }