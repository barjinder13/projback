const express = require('express')
const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

require('dotenv').config()

const bcrypt = require('bcrypt');

const fs = require('fs');

var jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');

var cors = require('cors')
app.use(cors())

const uuid = require('uuid');
 
const mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1:27017/groworld_db').then(() => console.log('connected to MongoDB!'));

mongoose.connect('mongodb+srv://vivakbisht7:godslayer13@cluster0.kdwbxlv.mongodb.net/grodb?retryWrites=true&w=majority&appName=Cluster0').then(() => console.log('connected to MongoDB!'));

const multer = require('multer');
const e = require('express')


var picname;
let mystorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");   // 0we will have to create folder ourselves
    },
    filename: (req, file, cb) => {
        picname = Date.now() + file.originalname; // milliseconds will be added with original filenameand name will be stored in picname variable
        cb(null, picname);
    }
});

let upload = multer({ storage: mystorage });

const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: 'localmart13@hotmail.com',
        pass: 'godslayer13@'
    }
})

function verifytoken(req, res, next)  // next means baad mai yhe chale login ya signup ke baad
{
    if (!req.headers.authorization) {
        res.status(401).send('Unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1]
    if (token == 'null') {
        return res.status(401).send('Unauthorized request')
    }
    let payload = jwt.verify(token, process.env.TOKEN_SECRET_KEY)
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    next()
}

var SignupSchema = new mongoose.Schema({
    name: String,
    phone: String,
    username: { type: String, unique: true },
    password: String,
    usertype: String,
    acttoken: String,
    actstatus: Boolean
}, { versionKey: false })

const SignupModel = mongoose.model("signup", SignupSchema, "signup")  // internal model name, schema name, collection_name

app.post("/api/signup", async (req, res) => {
    try {
        const encpass = bcrypt.hashSync(req.body.pass, 10);
        var token = uuid.v4();

        const newrecord = new SignupModel({ name: req.body.pname, phone: req.body.phone, username: req.body.uname, password: encpass, usertype: req.body.utype, acttoken: token, actstatus: false });

        var result = await newrecord.save();
        // console.log(result)
        if (result) {
            const mailOptions =
            {
                from: 'localmart13@hotmail.com',
                to: req.body.uname,
                subject: 'Account Activation Mail from Local Mart',
                text: `Hello${req.body.pname}\n\n Thanks for signing up on our website. Please click on the beow to activate your account and login on our website \n\n https://localmart.onrender.com/activateaccount?token=${token}`
            };

            // Use the transport object to send the email 
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.send({ statuscode: -2 })
                }
                else {
                    console.log('Email sent: ' + info.response);
                    res.send({ statuscode: 1 });
                }
            });
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})



app.post("/api/login", async (req, res) => {
    try {
        var result = await SignupModel.findOne({ username: req.body.uname })
        if (result === null) {
            res.send({ statuscode: 0 });
        }
        else {
            if (bcrypt.compareSync(req.body.pass, result.password) === true) {
                if (result.actstatus === true) {
                    if (result.usertype === "admin") {
                        let token = jwt.sign({ data: result._id }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1h' });
                        res.send({ statuscode: 1, udata: result, jtoken: token })
                    }
                    else {
                        res.send({ statuscode: 1, udata: result })
                    }
                }
                else {
                    res.send({ statuscode: -2 })
                }
            }
            else {
                res.send({ statuscode: 0 });
            }
        }
    }

    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }

})

app.get("/api/searchuser", async (req, res) => {
    try {
        var result = await SignupModel.findOne({ username: req.query.un })
        if (result === null) {
            res.send({ statuscode: 0 });
        }
        else {
            res.send({ statuscode: 1, udata: result })
        }

    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }

})

app.get("/api/fetchbyuid/:id", async (req,res) => 
{
    try {
        var result = await SignupModel.findById(req.params.id)
        if (result) {
            res.send({statuscode: 1,udata:result})

        }
        else {
            res.send({statuscode:0});
        }

    }
    catch(e) {
        res.send({statuscode:-1,errcode: e.code})
    }

})

app.get("/api/fetchmembers", async (req, res) => {
    try {
        var result = await SignupModel.find()
        if (result.length === 0) {
            res.send({ statuscode: 0 });
        }
        else {
            res.send({ statuscode: 1, udata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})


app.delete("/api/deleteuser/:uid", async (req, res) => {
    try {
        var result = await SignupModel.deleteOne({ _id: req.params.uid })
        if (result.deletedCount === 1) {
            res.send({ statuscode: 1 });
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})
var CatSchema = new mongoose.Schema({
    catname: String,
    picture: String
}, { versionKey: false })

const CatModel = mongoose.model("category", CatSchema, "category")

app.post("/api/savecategory", upload.single('catpic'), async (req, res) => {
    if (!req.file) {
        picname = "defaultpic.png";
    };
    try {
        var newrecord = new CatModel({ catname: req.body.cname, picture: picname });
        var result = await newrecord.save();
        if (result) {
            res.send({ statuscode: 1 })
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})

app.get("/api/fetchallcat", async (req, res) => {
    try {
        var result = await CatModel.find();
        if (result.length === 0) {
            res.send({ statuscode: 0 });
        }
        else {
            res.send({ statuscode: 1, catdata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
}
)

var subCatSchema = new mongoose.Schema({
    catid: String,
    subcatname: String,
    picture: String
}, { versionKey: false })

const SubCatModel = mongoose.model("subcategory", subCatSchema, "subcategory")

app.post("/api/savesubcategory", upload.single('scatpic'), async (req, res) => {
    if (!req.file) {
        picname = "defaultpic.png"; // give default pic name which we have cpoied ourselves in uplods folder
    };
    try {
        var newrecord = new SubCatModel({ catid: req.body.catid, subcatname: req.body.scname, picture: picname });
        var result = await newrecord.save();
        if (result) {
            res.send({ statuscode: 1 })
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})
app.get("/api/fetchsubcat/:cid", async (req, res) => {
    try {
        var result = await SubCatModel.find({ catid: req.params.cid });
        if (result.length === 0) {
            res.send({ statuscode: 0 });
        }
        else {
            res.send({ statuscode: 1, subcatdata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }

})

var ProdSchema = new mongoose.Schema({
    catid: String,
    subcatid: String,
    prodname: String,
    rate: String,
    discount: String,
    stock: Number,
    description: String,
    featured: String,
    featured: String,
    addedon: String,
    picture: String,
}, { versionKey: false })

const ProductModel = mongoose.model("product", ProdSchema, "product")
app.post("/api/saveproducts", upload.single('prodpic'), async (req, res) => {
    if (!req.file) {
        picname = "defaultpic.png"; // give default pic name which we have copiedourselve uploads folder
    }
    try {
        var newrecord = new ProductModel({ catid: req.body.catid, subcatid: req.body.scid, prodname: req.body.prodname, rate: req.body.rate, discount: req.body.discount, stock: req.body.stock, description: req.body.descrip, featured: req.body.featured, picture: picname, addedon: new Date() });

        var result = await newrecord.save();
        if (result) {
            res.send({ statuscode: 1 })
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})
app.delete("/api/deletecat/:cid", async (req, res) => {
    try {
        var result = await CatModel.deleteOne({ _id: req.params.cid })
        if (result.deletedCount === 1) {
            res.send({ statuscode: 1 });
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})


app.put("/api/updatecategory", upload.single('catpic'), async (req, res) => {
    // var d = new Data();
    if (!req.file) {
        picname = req.body.oldpicname;
    }
    else {
        if (req.body.oldpicname != "defaultpic.jpg") {
            fs.unlinkSync('public/uploads/' + req.body.oldpicname);
        }
    }
    var updateresult = await CatModel.updateOne({ _id: req.body.cid }, { $set: { catname: req.body.cname, picture: picname } });
    if (updateresult.modifiedCount === 1) {
        res.send({ statuscode: 1 })
    }
    else {
        res.send({ statuscode: 0 })
    }
});

app.get("/api/fetchsubcatdetails", async (req, res) => {
    try {
        var result = await SubCatModel.findOne({ _id: req.query.subcatid });
        if (!result) {
            res.send({ statuscode: 0 });
        }
        else {
            res.send({ statuscode: 1, subcatdata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }

})

app.put("/api/updatesubcategory", upload.single('scatpic'), async (req, res) => {
    // var d = new Data();
    if (!req.file) {
        picname = req.body.oldpicname;
    }
    else {
        if (req.body.oldpicname != "defaultpic.jpg") {
            fs.unlinkSync('public/uploads/' + req.body.oldpicname);
        }
    }
    var updateresult = await SubCatModel.updateOne({ _id: req.body.subcatid }, { $set: { catid: req.body.catid, subcatname: req.body.scname, picture: picname } });

    console.log(updateresult);
    if (updateresult.modifiedCount === 1) {
        res.send({ statuscode: 1 })
    }
    else {
        res.send({ statuscode: 0 })
    }
});

app.delete("/api/deletesubcat/:subcatid", async (req, res) => {
    try {
        var result = await SubCatModel.deleteOne({ _id: req.params.subcatid })
        if (result.deletedCount === 1) {
            res.send({ statuscode: 1 });
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})



app.get("/api/fetchproductsbysubcat/:scid", async (req, res) => {
    try {
        var result = await ProductModel.find({ subcatid: req.params.scid });
        if (result.length === 0) {
            res.send({ statuscode: 0 });
        }
        else {
            res.send({ statuscode: 1, prodsdata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }

})

app.get("/api/fetchproductbyprodid", async (req, res) => {
    try {
        var result = await ProductModel.findById(req.query.prodid);
        if (result) {
            res.send({ statuscode: 1, proddata: result })
        }
        else {
            res.send({ statuscode: 0 });
        }
    }
    catch (e) {
        res.send({ statusecode: -1, errcode: e.code })
    }
})

app.delete("/api/deleteproduct/:prodid", async (req, res) => {
    try {
        var result = await ProductModel.deleteOne({ _id: req.params.prodid })
        if (result.deletedCount === 1) {
            res.send({ statuscode: 1 });
        }
        else {
            res.send({ statuscode: 0 })

        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code });

    }
})

app.put("/api/updateproduct", upload.single('prodpic'), async (req, res) => {
    // var d = new Data();
    if (!req.file) {
        picname = req.body.oldpicname;
    }
    else {
        if (req.body.oldpicname != "defaultpic.jpg") {
            fs.unlinkSync('public/uploads/' + req.body.oldpicname);
        }
    }
    var updateresult = await ProductModel.updateOne({ _id: req.body.pid }, { $set: { catid: req.body.catid, subcatid: req.body.scid, prodname: req.body.prodname, rate: req.body.rate, discount: req.body.discount, stock: req.body.stock, description: req.body.descrip, featured: req.body.featured, picture: picname } });

    if (updateresult.modifiedCount === 1) {
        res.send({ statuscode: 1 })
    }
    else {
        res.send({ statuscode: 0 })
    }
});

app.put("/api/changepassword", async (req,res) => {
    try {
        var result = await SignupModel.findOne({ username: req.body.uname})
        if (!result) {
            res.send({ statuscode: -3 });
        }
        else {
            if (bcrypt.compareSync(req.body.currpass, result.password) === true) {
                const encpass = bcrypt.hashSync(req.body.newpass, 10);
                var updateresult = await SignupModel.updateOne({ username: req.body.uname }, { $set: { password: encpass } });
                if (updateresult.modifiedCount === 1) {
                    res.send({ statuscode: 1 });
                }
                else {
                    res.send({ statuscode: -3 });
                }
            }
            else {
                res.send({ statuscode: -2 });
            }
        }
    }
    catch (e) {
        console.log(e);
        res.send({ statuscode:-4});
    }
})

var CartSchema = new mongoose.Schema({
    picture: String,
    prodid: String,
    pname: String,
    rate: Number,
    qty: Number,
    tcost: Number,
    username: String
}, { versionKey: false })

const CartModel = mongoose.model("cart", CartSchema, "cart") // internal model name, schema name, collection name

app.post("/api/savetocart", async (req, res) => {
    try {
        var newrecord = new CartModel({ picture: req.body.picname, prodid: req.body.prodid, pname: req.body.pname, rate: req.body.rate, qty: req.body.qty, tcost: req.body.tcost, username: req.body.uname });
        var result = await newrecord.save();
        if (result) {
            res.send({ statuscode: 1 })
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})


app.delete("/api/delcartprod/:prodid", async (req, res) => {
    try {
        var result = await CartModel.deleteOne({ _id: req.params.prodid })
        if (result.deletedCount === 1) {
            res.send({ statuscode: 1 });
        }
        else {
            res.send({ statuscode: 0 })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})

app.get("/api/fetchcart/:uname", async (req, res) => {
    try {
        var result = await CartModel.find({ username: req.params.uname })
        if (result.length === 0) {
            res.send({ statuscode: 0 });
        }
        else {
            res.send({ statuscode: 1, cdata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})

var checkoutSchema = new mongoose.Schema({
    address: String,
    city: String,
    state: String,
    phone: String,
    billamount: Number,
    username: String,
    orderdt: String,
    items: [Object],
    status: String
}, { versionKey: false })

const checkoutModel = mongoose.model("order", checkoutSchema, "order")// internal model name, schema_name, collection_name

app.post("/api/saveorder", async (req, res) => {
    try {
        var newrecord = new checkoutModel({ address: req.body.saddr, city: req.body.city, state: req.body.state, phone: req.body.phone, billamount: req.body.billamount, username: req.body.uname, orderdt: new Date(), items: req.body.cartdata, status: "Order Received, Processing" });

        var result = await newrecord.save();
        if (result) {
            let updateresp = false;
            var updatelist = req.body.cartdata;//updatelist becomes an array becoz we are saving an json array into it
            for (let x = 0; x < updatelist.length; x++) {
                var updateresult = await
                    ProductModel.updateOne({ _id: updatelist[x].prodid }, { $inc: { "stock": -updatelist[x].qty } });
                if (updateresult.modifiedCount === 1) {
                    updateresp = true;
                }
                else {
                    updateresp = false;
                }
            }
            if (updateresp == true) {
                var delres = CartModel.deleteMany({ username: req.body.uname })
                if ((await delres).deletedCount >= 1) {
                    res.json({ statuscode: 1 });
                }
                else {
                    res.json({ statuscode: 0 });
                }
            }
            else {
                res.json({ statuscode: 0 });
            }
        }
        else {
            res.json({ statuscode: 0 })
        }

    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code, err: e })
        console.log(e)
    }
})

app.get("/api/fetchorderdetails/:uname", async (req, res) => {
    var result = await
        checkoutModel.findOne({ username: req.params.uname }).sort({ "order": -1 });
    console.log(result)
    if (!result) {
        res.send({ statuscode: 0 })
    }
    else {
        res.send({ statuscode: 1, orderdata: result })
    }
})
app.get("/api/fetchorders", async (req, res) => {
    try {
        var result = await checkoutModel.find().sort({ "orderdt": -1 });
        if (result.length === 0) {
            res.send({ statuscode: 0 });
        }
        else {
            res.send({ statuscode: 1, odata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})
app.get("/api/fetchitems/:oid", async (req, res) => {
    try {
        var result = await checkoutModel.findOne({ _id: req.params.oid });
        if (result.length === 0) {
            res.send({ statuscode: 0 })
        }
        else {
            res.send({ statuscode: 1, odata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})

app.put("/api/updatestatus", async (req, res) => {

    var updateresult = await checkoutModel.updateOne({ _id: req.body.orderid }, { $set: { status: req.body.newst } });

    if (updateresult.modifiedCount === 1) {
        res.send({ statuscode: 1 });
    }
    else {
        res.send({ statuscode: 0 })
    }
});

app.get("/api/fetchuserorders/:uname", async (req, res) => {
    try {
        var result = await checkoutModel.find({ username: req.params.uname }).sort({ "orderdt": -1 });
        if (result.length === 0) {
            res.send({ statuscode: 0 })
        }
        else {
            res.send({ statuscode: 1, odata: result })
        }
    }
    catch (e) {
        res.send({ statuscode: -1, errcode: e.code })
    }
})


app.get("/api/fetchlatestprods", async (req, res) => {
    var result = await ProductModel.find().sort({ "AddedOn": -1 }).limit(6);
    if (result.length === 0) {
        res.json({ statuscode: 0 })
    }
    else {
        res.send({ statuscode: 1, prodsdata: result });
    }
});

app.get("/api/fetchprodsbyname/:term", async (req, res) => {
    var searchtext = req.params.term;
    var result = await ProductModel.find({ prodname: { $regex: '.*' + searchtext, $options: 'i' } });
    if (result.length === 0) {
        res.json({ statuscode: 0 })
    }
    else {
        res.send({ statuscode: 1, prodsdata: result });
    }
});

app.post("/api/contactus", async (req, res) => {
    const mailOptions =
    {
        from: 'localmart13@hotmail.com',
        to: 'martvivs@gmail.com',
        subject: 'Message from Website - Contact Us',
        text: `Name:-${req.body.pname}\nPhone:-${req.body.phone}\nEmail:-${req.body.email}\nMessage:-${req.body.msg}`
    };

    // Use the transport object to send the email 
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send({ msg: 'Error sending email' });
        }
        else {
            console.log('Email sent: ' + info.response);
            res.send({ msg: "Message sent successfully" });
        }
    });

});
app.put("/api/activateaccount", async (req, res) => {
    var updateresult = await SignupModel.updateOne({ acttoken: req.body.token }, { $set: { actstatus: true } });
    if (updateresult.modifiedCount === 1) {
        res.send({ statuscode: 1 });
    }
    else {
        res.send({ statuscode: 0 })
    }
});

var resetPasswordSchema = new mongoose.Schema({ username: String, token: String, exptime: String }, { versionKey: false });

var resetpassModel = mongoose.model("resetpass", resetPasswordSchema, "resetpass");
app.get('/api/forgotpassword', async (req, res) => {
    const userdata = await SignupModel.findOne({ username: req.query.username });
    if (!userdata) {
        return res.send({ msg: 'Invalid Username' });
    }
    else {
        var resettoken = uuid.v4();
        var minutesToAdd = 15;
        var currentDate = new Date();
        var futureDate = new Date(currentDate.getTime() + minutesToAdd * 60000);

        var newreset = new resetpassModel({ username: req.query.username, token: resettoken, exptime: futureDate });
        let saveresult = await newreset.save();

        if (saveresult) {
            const resetLink = `https://localmart.onrender.com/resetpassword?token=${resettoken}`;
            const mailOptions =
            {
                from: 'localmart13@hotmail.com',
                to: req.query.username,
                subject: 'Reset your Password:: LocalMart.com',
                text: `Hi${userdata.name}\n\n Please click on the following link to reset your password: ${resetLink}`
            };

            // Use the transport object to send the email 
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.status(500).send({ msg: 'Error sending email' });
                }
                else {
                    console.log('Email sent: ' + info.response);
                    res.status(200).send({ msg: "Please check your mail to reset your password" });
                }
            });
        }
        else {
            res.send({ msg: "Error, try again" });
        }
    }
    // user.isActive = true;
    // await user.save();
    // return res.status(200).send({msg:'Account activated Successfully'});
});

app.get('/api/checktoken', async (req, res) => {
    const resetdata = await resetpassModel.findOne({ token: req.query.token });
    if (!resetdata) {
        return res.send({ statuscode: -1, msg: 'Invalid reset Link. try Again' });
    }
    else {
        console.log(resetdata);
        var exptime = new Date(resetdata.exptime); // mon feb 05 2024 16:08:26 GMT+0530
        var currenttime = new Date(); // mon feb 05 2024 16:09:26 GMT+0530
        if (currenttime < exptime) {
            res.send({ statuscode: 1, username: resetdata.username })
        }
        else {
            return res.send({ statuscode: 0, msg: 'Link Expired. It as valid for 15 min only. Request New Link' });
        }
    }
});

app.put("/api/resetpassword/:uname", async (req, res) => {
    try 
    {
        const encpass = bcrypt.hashSync(req.body.newp, 10);
        var updateresult = await SignupModel.updateOne({ username: req.params.uname }, { $set: { password: encpass } });
        if (updateresult.modifiedCount === 1) {
            res.send({ statuscode: 1 });
        }
        else {
            res.send({ statuscode: -3 });
        }
    }
    catch (e) {
        console.log(e);
        res.send({ statuscode: 0 });
    }
})


const ProdImagesSchema = new mongoose.Schema({
    productId: {type: String, required: true },
    imageNames:[String]
},{versionKey:false});

const ProdImagesModel = mongoose.model('prodpics', ProdImagesSchema,"prodpics");

app.post('/api/prodimages',upload.array('images'), async (req, res)=>
{
    const { productId } = req.body;
    try
    {
        const imageNames = req.files.map(file=> file.filename);

        const product = await ProdImagesModel.create({
            productId,
            imageNames
        });
        res.json({statuscode:1});
    }
    catch(e)
    {
        console.error('Error saving product images:',e);
        res.status(500).json({statuscode:0,error: 'serverv error' });
    }
});

app.get('/api/fetchproductimages/:productId',async (req,res)=>{
    try
    {
        const pimages = await ProdImagesModel.findOne({productId:req.params.productId});
        if(!pimages)
        {
            return res.status(404).json({statuscode:0, error: 'Images not found'});
        }
        else
        {
            return res.json({statuscode:1,pics:pimages.imageNames});
        }
    }
    catch(e)
    {
        console.error('Error fetching images:',e);
        res.status(500).json({error:'Server error' });
    }
});

app.listen(9000, () => {
    console.log("Node server is running");           //APIs
})
