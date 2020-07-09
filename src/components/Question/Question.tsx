import React, { useState, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Form } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Question.module.css'

const QuestionPage: React.FC = () => {
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

                    <Button variant="outline-dark" onClick={() => { firebase.doSignOut() }}>
                        sign out
                    </Button>
                </Nav>
            </Navbar>
            <Container className={styles.paddingTop}>
                <Card style={{ marginBottom: 30 }}>
                    <Card.Body>
                        <Card.Title>This is the title</Card.Title>
                        <Card.Text>This is some desc.</Card.Text>
                    </Card.Body>
                </Card>

                <Form onSubmit={handleSubmit}>

                    <Form.Group controlId="description">
                        <Form.Label>Answer</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="" onChange={handleDescriptionChange} />
                    </Form.Group>

                    <Button variant="primary" type="submit" style={{ marginTop: 15 }}>
                        Post
                        </Button>
                </Form>
                <hr></hr>
                <h3 style={{ paddingTop: 50, paddingLeft: 22, paddingBottom: 15 }}>Comments</h3>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title>@guy</Card.Title>
                        <Card.Text className={styles.fontLess}> This is my answer</Card.Text>
                    </Card.Body>
                </Card>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title>@guy</Card.Title>
                        <Card.Text className={styles.fontLess}> This is my answer</Card.Text>
                    </Card.Body>
                </Card>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title>@guy</Card.Title>
                        <Card.Text className={styles.fontLess}> This is my answer</Card.Text>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}


export { QuestionPage }
