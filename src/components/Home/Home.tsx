import React, { useState, useCallback, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Home.module.css'

const HomePage: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [title, setTitle] = useState<string>('')
    const [description, setDescription] = useState<string>('')

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
        const getPosts = async () => {
            try {
                const posts = await (await firebase.db.collection('posts').doc('9rY7uHB1kDUvWj2j6tKY').get()).data();
                console.log('posts = ', posts);
                setTitle(posts?.title)
                setDescription(posts?.desc)
            } catch (e) {
                console.log(e)
            }
            
        }

        getPosts()
    })

    const feedCard = (title: string, description: string) => {
        return (
            <Card style={{ marginBottom: 15 }}>
                <Card.Body>
                <Card.Title>{title}</Card.Title>
                    <Card.Text className={styles.fontLess}>{description}</Card.Text>
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
                    </div>
                    {feedCard(title, description)}
                    <Button href="/post">Create Post</Button>
                </Container>
            </div>
        )
    }
}

export { HomePage }
