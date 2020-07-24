import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Button, Modal, Container, Row, Col, Form, Spinner, FormControl } from 'react-bootstrap'
import { useFirebase, Firebase } from '../components/Firebase'
import { useSession } from '../components/Session'
import { LoginPage } from '../components/Login'
import { SignupPage } from '../components/Signup'
import { PostPage } from '../components/Post'

const NavBar: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [loginModalShow, setLoginModalShow] = useState<boolean>(false);
    const [signupModalShow, setSignupModalShow] = useState<boolean>(false);
    const [postModalShow, setPostModalShow] = useState<boolean>(false);



    return (
        <Navbar bg="light" variant="light">
            <Navbar.Brand href="/">
                {' '}
                            ioyou
                    </Navbar.Brand>
            <Modal show={loginModalShow} onHide={() => {
                setLoginModalShow(false)
            }}>
                <Modal.Header>Log in</Modal.Header>
                <Modal.Body>
                    <LoginPage />
                </Modal.Body>
            </Modal>
            <Modal show={signupModalShow} onHide={() => {
                setSignupModalShow(false)
            }}>
                <Modal.Header closeButton>Sign up</Modal.Header>
                <Modal.Body>
                    <SignupPage />
                </Modal.Body>
            </Modal>
            <Modal show={postModalShow} onHide={() => {
                setPostModalShow(false)
            }}>
                <Modal.Header closeButton>New Post</Modal.Header>
                <Modal.Body>
                    <PostPage />
                </Modal.Body>
            </Modal>
            <Nav className="ml-auto">
                {session.auth ?
                    <div>
                        <Button variant="light" onClick={async () => {
                            const user = await firebase.db.collection('users').doc(session?.auth?.uid).get()
                            const username = user?.data()?.username
                            window.location.href = `/user/${username}`
                        }} style={{ marginRight: 10 }}>
                            Profile
                            </Button>
                        <Button onClick={() => {
                            setPostModalShow(true)
                        }} variant="outline-dark" style={{ marginRight: 10 }}>Post</Button>
                        <Button variant="light" onClick={() => {
                            firebase.doSignOut()
                            window.location.reload()
                        }}>
                            Sign Out
                            </Button>
                    </div>

                    :
                    <div>
                        <Button variant="outline-dark" onClick={() => { setLoginModalShow(true) }} style={{ marginRight: 10 }}>
                            log in
                                </Button>

                        <Button variant="light" onClick={() => { setSignupModalShow(true) }}>
                            sign up
                                </Button>
                    </div>
                }

            </Nav>
        </Navbar>
    )
}

export { NavBar }