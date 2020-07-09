import React, { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { useFirebase, Firebase } from '../Firebase'
import { firestore } from 'firebase'
import { Navbar, Nav, Button, DropdownButton, Dropdown, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Profile.module.css'

const ProfilePage: React.FC = () => {
    const { username } = useParams()
    const firebase = useFirebase()
    const session = useSession()

    const [user, setUser] = useState<any>(null);
    const [userLoading, setUserLoading] = useState<boolean>(true);

    const [userSelf, setUserSelf] = useState<boolean>(false);
    const [editSubjects, setEditSubjects] = useState<boolean>(false);

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

        if (session.auth) {
            const getSelf = async () => {
                const self = await firestore().collection('users').doc(session?.auth?.uid).get()
                if (self?.data()?.username == username) {
                    setUserSelf(true);
                }
            }
            getSelf();
        }

    }, [session, firebase])

    const editSubjectsView = () => {
        return (
            <Row style={{ paddingTop: 15, paddingLeft: 15 }}>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>Arts</Button>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>Business</Button>
                <DropdownButton id="cs" title="Computer Science" variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item>
                        Languages
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Organization and OS
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Other
                    </Dropdown.Item>
                </DropdownButton>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>Economics</Button>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>Finance</Button>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>History</Button>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>Humanities</Button>
                <DropdownButton id="lang" title="Languages" variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item>
                        French
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Mandarin
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Spanish
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Other
                    </Dropdown.Item>
                </DropdownButton>
                <DropdownButton id="math" title="Mathematics" variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item>
                        Calculus
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Multi-variable
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Linear Algebra
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Other
                    </Dropdown.Item>
                </DropdownButton>
                <DropdownButton id="sci" title="Sciences" variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item>
                        Biology
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Chemistry
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Physics
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Other
                    </Dropdown.Item>
                </DropdownButton>
                <DropdownButton id="lang" title="Social Sciences" variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item>
                        Psychology
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Sociology
                    </Dropdown.Item>
                    <Dropdown.Item>
                        Other
                    </Dropdown.Item>
                </DropdownButton>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>Other</Button>
            </Row>
        )
    }

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
                            <Button variant="light" onClick={async () => {
                                const user = await firebase.db.collection('users').doc(session?.auth?.uid).get()
                                const username = user?.data()?.username
                                window.location.href = `/user/${username}`
                            }} style={{ marginRight: 10 }}>
                                Profile
                            </Button>
                            <Button href="/post" variant="outline-dark" style={{ marginRight: 10 }}>Create Post</Button>
                            <Button variant="light" onClick={() => { firebase.doSignOut() }}>
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
                        <Card>
                            <Card.Body>
                                <Row>
                                    <Col>
                                        <h2>@{username}</h2>
                                        <h2>{user.name}</h2>
                                    </Col>
                                    <Col>
                                        <h3>Credits: </h3>
                                    </Col>
                                </Row>


                                <hr></hr>

                                <Row style={{ paddingLeft: 15 }}>
                                    <h3 style={{ paddingRight: 15 }}>Subjects</h3>
                                    {userSelf ?
                                        <Button onClick={() => { setEditSubjects(true) }}>Edit</Button>
                                        :
                                        <div></div>
                                    }
                                </Row>
                                {
                                    editSubjects ?
                                        editSubjectsView()
                                        :
                                        <div></div>
                                }
                            </Card.Body>

                        </Card>

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
