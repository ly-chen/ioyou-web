import React, { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { useFirebase, Firebase } from '../Firebase'
import { firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Profile.module.css'

const ProfilePage: React.FC = () => {
    const { username } = useParams()
    const firebase = useFirebase()
    const session = useSession()

    const [user, setUser] = useState<any>(null);
    const [userLoading, setUserLoading] = useState<boolean>(true);

    useEffect(() => {
        const getUser = async () => {
            const results = await firestore().collection('users').where('username', '==', username).limit(1).get();
            if (results.empty) {
                console.log('empty');
                setUserLoading(false);
            } else {
                setUser(results.docs[0].data())
                console.log(results.docs[0].data())
                setUserLoading(false);
            }
        }
        getUser();
    }, [session, firebase])

    return (
        <div>
            <Navbar bg="light" variant="light">
                <Navbar.Brand href="/">
                    {' '}
                            ioyou
                    </Navbar.Brand>
                <Nav className="ml-auto">
                    {session.auth ?
                        <div>
                            <Button href="/post" style={{ marginRight: 10 }}>Create Post</Button>
                            <Button variant="outline-dark" onClick={() => { firebase.doSignOut() }}>
                                sign out
                            </Button>
                        </div>

                        :
                        <div>
                            <Button variant="outline-dark" href="/login" style={{ marginRight: 10 }}>
                                log in
                                </Button>

                            <Button variant="light" href="/signup">
                                sign up
                                </Button>
                        </div>
                    }

                </Nav>
            </Navbar>
            {userLoading ?
                <Container className={styles.paddingTop}>
                    <Spinner animation="border" />
                </Container>
                :
                user ?
                    <Container className={styles.paddingTop}>
                        <h2>@{username}</h2>
                        <h2>{user.name}</h2>
                    </Container>
                    :
                    <Container className={styles.paddingTop}>
                        <h1>User does not exist.</h1>
                    </Container>
            }

        </div>
    )
}

export { ProfilePage }
