const WebSocket = require('ws');
const Pool = require('pg').Pool

const wsServer = new WebSocket.Server({port: 9000});

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sheet',
    password: '123qweASD',
    port: 5432,
})

updateData = (data) => {
    return new Promise((resolve, reject) => {
        pool.query(`update report set data = '${JSON.stringify(data)}' where id = 1`, function (err, data) {
            if (err)
                reject(err)
            resolve({status: "success"});
        });
    })
}

getData = () => {
    return new Promise((resolve, reject) => {
        pool.query("select * from report where id = 1", function (err, data) {
            if (err)
                reject(err)
            resolve(data.rows[0].data)
        })
    })
}

let onConnect = (client) => {
    client.send(JSON.stringify({"action": "READY", "data": []}))

    client.on('message', function(message) {
        try {
            const jsonMessage = JSON.parse(message);

            switch (jsonMessage.action) {
                case 'ECHO':client.send(jsonMessage.data);break;
                case 'PING':setTimeout(function() {client.send('PONG');}, 1000);break;
                case 'SAVE':
                    updateData(jsonMessage.data)
                        .then(data => client.send(JSON.stringify(data)))
                        .catch(err => client.send(err))
                    break;
                case 'GET':
                    getData()
                        .then(data => client.send(JSON.stringify({"action": "GET", "data": data})))
                        .catch(err => client.send(err))
                    break;
                default:
                    console.log('Неизвестная команда');
                    break;
            }
        } catch (error) {
            console.log('Ошибка', error);
        }
    });

    client.on('close', function() {
        console.log('Клиент отключился');
    });
}

wsServer.on('connection', onConnect);
