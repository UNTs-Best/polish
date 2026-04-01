import express from express
import * from env


let app = express()




app.use('/health', (req, res)=>{
    res.send({
        "health": "ok"
    })
})


app.listen()