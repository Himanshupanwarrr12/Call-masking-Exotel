require('dotenv').config();
const express = require("express");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const CUSTOMER_NUMBER = process.env.CUSTOMER_NUMBER;
const RIDER_NUMBER = process.env.RIDER_NUMBER;
const EXOTEL_NUMBER = process.env.EXOTEL_NUMBER;

const cleanNumber = (num = "") => {
    let cleaned = num.replace(/\D/g, "");

    if (cleaned.startsWith("91") && cleaned.length === 12) {
        cleaned = cleaned.slice(2);
    }

    if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
    }

    if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
    }

    return cleaned; // always 10 digits
};

app.all("/exotel/connect", (req, res) => {
    console.log("\n========= EXOTEL CALL HIT =========");

    const data = req.method === "GET" ? req.query : req.body;
    console.log("Raw Data:", data);

    const fromNumber = cleanNumber(data.CallFrom);
    const storedRider = cleanNumber(RIDER_NUMBER);
    const storedCustomer = cleanNumber(CUSTOMER_NUMBER);

    console.log("--- Number Comparison ---");
    console.log("From Number    :", fromNumber);
    console.log("Stored Rider   :", storedRider);
    console.log("Stored Customer:", storedCustomer);

    let connectTo = "";

    if (fromNumber === storedRider) {
        console.log("✅ Rider matched → Connecting to Customer");
        connectTo = CUSTOMER_NUMBER;
    } else if (fromNumber === storedCustomer) {
        console.log("✅ Customer matched → Connecting to Rider");
        connectTo = RIDER_NUMBER;
    } else {
        console.log("❌ NO MATCH FOUND");
        return res.status(200).json({
            destination: {
                numbers: []
            }
        });
    }

    const payload = {
        fetch_after_attempt: false,
        destination: {
            numbers: [connectTo]
        },
        outgoing_phone_number: EXOTEL_NUMBER,
        record: true,
        max_ringing_duration: 45
    };

    console.log("Returning Payload:", JSON.stringify(payload, null, 2));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(payload);
});

app.get("/", (req, res) => {
    res.json({
        status: "Running",
        mode: "Call Masking",
        config: {
            RIDER_NUMBER: RIDER_NUMBER,
            CUSTOMER_NUMBER: CUSTOMER_NUMBER,
            EXOTEL_NUMBER: EXOTEL_NUMBER
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server Running On Port ${PORT}`);
    console.log(`📡 Test Rider: http://localhost:${PORT}/exotel/connect?CallFrom=${encodeURIComponent(RIDER_NUMBER)}`);
    console.log(`📡 Test Customer: http://localhost:${PORT}/exotel/connect?CallFrom=${encodeURIComponent(CUSTOMER_NUMBER)}`);
});