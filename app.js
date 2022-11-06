/*imports*/

const http = require('http');
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require("path");
require('dotenv').config()
const app  = express()
const server = http.createServer(app);
const bodyParser = require('body-parser');

// Fetch data
const apiURL = process.env.API_URL
app.get('/data', async (req, res) => {
	const response = await fetch(apiURL)
	const data = response.json()
	res.json({data})
})

//Config JSON response

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));

//Open Route - Public Route

app.get('/',(req,res) => {
    res.status(200).json({ msg:'API started' })
    res.sendFile(path.join(__dirname,'./public/index.html'));
});

// Credentials

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.a4qjq63.mongodb.net/?retryWrites=true&w=majority`).then(() => {
    server.listen(3000, function(){
        console.log("server is listening on port: 3000");
    });
    console.log('Conectou ao banco!')
}).catch((err) => console.log(err))

//Private Route

app.get("/user/:id", checkToken, async(req, res) => {
    const id = req.params.id

    //check if user exists

    const user = await User.findById(id, '-password')

    if(!user) {
        return res.status(404).json({ msg: "Usuário não encontrado" })
    }

    res.status(200).json({ user })

})

function checkToken(req,res,next) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if(!token) {
        return res.status(401).json({ msg: "Acesso negado!" })
    }

    try {
        
        const secret = process.env.SECRET

        jwt.verify(token, secret)

        next()

    }catch(error) {
        res.status(400).json({ msg: "Token inválido" })
    }

}

//Register
app.post('/auth/register', async(req, res) => {
    const {username, email, password, confirmpassword} = req.body

    //Validations
    if(!username) {
        return res.status(422).json({ msg: 'O nome é obrigatório!' })
    }

    if(!email) {
        return res.status(422).json({ msg: 'O email é obrigatório!' })
    }

    if(!password) {
        return res.status(422).json({ msg: 'O password é obrigatório!' })
    }

    if(confirmpassword !== password) {

        res.render('registration', {signupRequest: 'success'});
    /* return res.status(422).json({ msg: 'As senhas não são idênticas!' })*/
    
    }

    //Check if user exists

    const userExists = await User.findOne({email: email})

    if(userExists) {
        return res.status(422).json({ msg: 'Email já cadastrado!'})
    }

    //Create password

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    //Create user

    const user = new User ({
        username,
        email,
        password: passwordHash,
    })

    try {
        await user.save()

        /*res.status(201).json({msg: 'Usuário criado com sucesso!'})*/
        res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='./login.html'>login</a></div><br><br><div align='center'><a href='./registration.html'>Register another user</a></div>");
        
    } catch(error) {
        console.log(error)
        res
        .status(500)
        .json({ msg: 'Aconteceu um erro no servidor!'})
        res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./registration.html'>Register again</a></div>");
    }

 })

 //Login user

 app.post("/auth/login", async(req, res) => {
    
    const {email, password} = req.body

    //validations

    if(!email) {
        return res.status(422).json({ msg: 'O email é obrigatório!' })
    }

    if(!password) {
        return res.status(422).json({ msg: 'O password é obrigatório!' })
    }

    //Check if users exists

    const user = await User.findOne({email: email})

    if(!user) {
        return res.status(422).json({msg: 'Usuário não encontrado!'})
    }

    //Check if password matches

    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(422).json({ msg:'Senha inválida!' })
    }

    try {
        const secret = process.env.SECRET

        const token  = jwt.sign(
            {
            id: user._id
            },
            secret,
        )

        res.status(200).json({ msg: "Autenticação realizada com sucesso!", token})
        res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${username}</h3></div><br><br><div align='center'><a href='./login.html'>logout</a></div>`);

    } catch (err) {
        console.log(error)

        res.status(500).json({
            msg: 'Aconteceu um erro no servidor!'
        })
        res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
    }

 })


