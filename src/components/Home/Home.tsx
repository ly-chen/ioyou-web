import React, { useCallback, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Home.module.css'

const HomePage: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    // Sample write to Firestore
    const accessFirestore = useCallback(async () => {
        if (session.auth?.uid) {
            try {
                await firebase.db.collection('profiles').doc(session.auth.uid).set({
                    key: 'value'
                })
            } catch (error) {
                console.log('Error writing Firestore', error)
            }
        }
    }, [session.auth, firebase])

    useEffect(() => {
        accessFirestore()
    }, [accessFirestore])
    console.log()

    const feedCard = () => {
        return (
            <Card style={{ marginBottom: 15 }}>
                <Card.Body>
                    <Card.Title>This is a title.</Card.Title>
                    <Card.Text className={styles.fontLess}>This is some text that takes the shape of a paragraph so you can easily visualize how something like this might look.</Card.Text>
                </Card.Body>
            </Card>
        )
    }
    if (session.auth) {
        return (
            <div>
                <p>Home</p>
                <p>Logged in!</p>
                <Button variant="info" onClick={() => { firebase.doSignOut() }}>Sign Out</Button>

            </div>
        )
    } else {
        //initial screen with no user
        return (
            <div>
                <Navbar bg="light" variant="light">
                    <Navbar.Brand href="/">
                        {' '}
                            ioyou
                    </Navbar.Brand>
                    <Nav className="ml-auto">

                        <Button variant="outline-dark" href="/login" style={{ marginRight: 10 }}>
                            log in
                        </Button>

                        <Button variant="light" href="/signup">
                            sign up
                        </Button>
                    </Nav>
                </Navbar>
                <Container className={styles.paddingTop}>
                    <div>
                        <h1 style={{ paddingLeft: 22 }}>Feed</h1>
                        {feedCard()}
                    </div>
                </Container>
            </div>
        )
    }
}

export { HomePage }
