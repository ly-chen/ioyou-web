import React, { useState, useEffect, PropsWithChildren } from 'react';
import { Button, Modal, Container, Form, Spinner } from 'react-bootstrap'
import { useFirebase } from '../Firebase'
import { useSession } from '../Session'
import styles from './Login.module.css'

const LoginPage: React.FC<any> = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [validated, setValidated] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [err, setErr] = useState<string>('')

    const [handling, setHandling] = useState<boolean>(false)


    const handleSubmit = async (event: any) => {
        event.preventDefault();
        setHandling(true);
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
                setHandling(false);
                window.location.reload()
            } catch (e) {
                console.log(e);
                setErr(e.message);
                setHandling(false);
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
        <Container>
            <Form validated={validated} onSubmit={handleSubmit}>
                <Form.Group controlId="formBasicEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control required type="email" placeholder="Enter email" onChange={handleChangeEmail} value={email} />
                </Form.Group>
                <Form.Group controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control required type="password" placeholder="Password" onChange={handleChangePassword} value={password} />
                </Form.Group>
                {handling ?
                    <Button variant="primary" disabled>
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                        />
                    </Button>
                    :
                    <Button variant="primary" type="submit" style={{ marginTop: 10 }}>
                        Log in
                        </Button>
                }

            </Form>
            <p className="text-danger">{err}</p>
        </Container>

    )
}

export { LoginPage }