import React, { useState, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Form } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Post.module.css'

const PostPage: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [title, setTitle] = useState<string>("")
    const [description, setDescription] = useState<string>("")

    useEffect(() => {
        if (!session.auth) {
            window.location.href = "/"
        }
    })

    const handleTitleChange = (event: any) => {
        setTitle(event.target.value)
    }

    const handleDescriptionChange = (event: any) => {
        setDescription(event.target.value)
    }

    const handleSubmit = async (event: any) => {
        event.preventDefault()
        console.log(title)
        console.log(description)
        const newPost = { title: title, desc: description, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid }
        await functions().httpsCallable('createPost')(newPost)
        window.location.href = "/"
    }


    return (
        <div>
            <Navbar bg="light" variant="light">
                <Navbar.Brand href="/">
                    {' '}
                            ioyou
                    </Navbar.Brand>
                <Nav className="ml-auto">
                    <Button variant="light" onClick={async () => {
                        const user = await firebase.db.collection('users').doc(session?.auth?.uid).get()
                        const username = user?.data()?.username
                        window.location.href = `/user/${username}`
                    }} style={{ marginRight: 10 }}>
                        Profile
                    </Button>
                    <Button variant="light" onClick={() => { firebase.doSignOut() }}>
                        sign out
                    </Button>
                </Nav>
            </Navbar>
            <Container className={styles.paddingTop}>
                <div>
                    <h1 style={{ paddingBottom: 15 }}>Create a new post</h1>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="title">
                            <Form.Label>Question</Form.Label>
                            <Form.Control required type="text" placeholder="What's your question?" onChange={handleTitleChange} />
                        </Form.Group>

                        <Form.Group controlId="description">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Add more details if necessary." onChange={handleDescriptionChange} />
                        </Form.Group>

                        <Button variant="primary" type="submit" style={{ marginTop: 15 }}>
                            Post
                        </Button>
                    </Form>
                </div>
            </Container>
        </div>
    )
}


export { PostPage }
