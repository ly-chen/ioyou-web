import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Form, OverlayTrigger, Spinner } from 'react-bootstrap'
import styles from './Signup.module.css'
import { auth, firestore } from 'firebase'
import { useFirebase, Firebase } from '../Firebase'
import { useSession } from '../Session'
import { AnyCnameRecord } from 'dns';

const SignupPage: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [validated, setValidated] = useState<boolean>(false);
    const [name, setName] = useState<string>('')
    const [username, setUsername] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [emailErr, setEmailErr] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [err, setErr] = useState<string>('')
    const [usernameErr, setUsernameErr] = useState<string>('')
    const [passCheck, setPassCheck] = useState<boolean>(false);

    const [handling, setHandling] = useState<boolean>(false);


    useEffect(() => {
        if (session.auth && (handling == false)) {
            window.location.href = "/"
        }
    }, [session, firebase])

    var actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be whitelisted in the Firebase Console.
        url: 'https://localhost:3000/finishSignUp?cartId=1234',
        // This must be true.
        handleCodeInApp: false,
    }

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        setHandling(true)
        console.log('name = ', name)
        console.log('username = ', username)
        console.log('email = ', email)
        console.log('password = ', password)
        console.log(event.currentTarget)
        if (event.currentTarget.checkValidity() === false || passCheck === false || usernameErr.length > 0 || emailErr.length > 0) {
            console.log(validated);
            event.preventDefault();
            event.stopPropagation();
        } else {
            const results = await checkUsername(username);
            if (results > 0) {
                setUsernameErr('Already taken.')
            } else {
                try {
                    console.log('this is triggered')
                    const newUser = await auth().createUserWithEmailAndPassword(email, password).catch(e => { console.log(e) })
                    if (newUser) {
                        console.log('this is triggered 2')
                        const uid = newUser?.user?.uid
                        await firestore().collection('users').doc(uid).set({ name: name, username: username, actives: { 'Arts': false, 'Biology': false, 'Business': false, 'Computer Science': false, 'Economics': false, 'Finance': false, 'French': false, 'General': true, 'Humanities': false, 'Languages (General)': false, 'Mandarin': false, 'Psychology': false, 'Spanish': false, 'bulletin': true }, upvoted: [], downvoted: [], credits: 25 }).then(() => {
                            window.location.href = `/user/${username}`
                        })

                        await auth().currentUser?.sendEmailVerification()
                    }
                    setValidated(true);
                } catch (e) {
                    console.log(e);
                    setErr(e.message);
                }
            }
        }
        setHandling(false);
    }

    const checkUsername = async (username: string) => {
        const results = await firestore().collection('users').where('username', '==', username).limit(1).get();
        return results.size;
    }

    const handleChangeName = (event: any) => {
        setName(event.target.value)
    }

    const handleChangeUsername = (event: any) => {
        setUsername(event.target.value)
        if (event.target.value.length > 15) {
            setUsernameErr('Too long. Usernames should be < 15 characters.')
        } else {
            setUsernameErr('')
        }
    }

    const handleChangeEmail = (event: any) => {
        var check = /uchicago.edu/
        setEmail(event.target.value)
        if (event.target.value.match(check)) {
            setEmailErr('')
        } else {
            setEmailErr('uchicago.edu addresses only.')
        }
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
        <Container style={{ paddingBottom: 10 }}>
            <Form validated={validated} onSubmit={handleSubmit}>

                <Form.Group controlId="formBasicName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control required type="text" placeholder="Jane Doe" onChange={handleChangeName} value={name} />
                    <Form.Control.Feedback type="invalid">
                        Please provide a name.
                        </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="formBasicName">
                    <Form.Label>Username</Form.Label>
                    <Form.Control required type="text" placeholder="username" onChange={handleChangeUsername} value={username} />
                    <Form.Text className="text-danger">
                        {usernameErr}
                    </Form.Text>
                </Form.Group>

                <Form.Group controlId="formBasicEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control required type="email" placeholder="jdoe@email.com" onChange={handleChangeEmail} value={email} />
                    <Form.Text className="text-danger">
                        {emailErr}
                    </Form.Text>
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
                    <Button variant="primary" type="submit">
                        Submit
                    </Button>
                }

            </Form>
            <p className="text-danger">{err}</p>
        </Container>
    )
}

export { SignupPage }