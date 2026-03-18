const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SHEET_ID = process.env.SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;

async function getDoc() {
    if (!GOOGLE_SERVICE_ACCOUNT || !SHEET_ID) {
        throw new Error("שגיאת קונפיגורציה: חסרים סודות במשתני הסביבה");
    }
    const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
    const serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}

// שלוחה 1: קבלת השאלה מימות המשיח והכנסתה לגיליון
app.all('/api/ymotAskAI', async (req, res) => {
    try {
        const question = req.query.question_text;
        const phone = req.query.ApiPhone || "לא ידוע";
        
        if (!question) return res.send("id_list_message=t-לא זוהתה הקשה");
        
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle["מענה AI"]; // חובה שהגיליון יקרא כך
        
        // מכניסים את השאלה לעמודה C (הגיליון מסדר את העמודות לפי הכותרות)
        await sheet.addRow({ "זמן": new Date().toLocaleString(), "מספר שורה": phone, "טקסט השאלה": question });
        
        res.send("id_list_message=t-שאלתך התקבלה המתן מספר שניות לתשובה");
    } catch (error) { res.send("id_list_message=t-חלה שגיאה במערכת"); }
});

// שלוחה 2: חיפוש התשובה הנקייה בגיליון והקראתה
app.all('/api/ymotReadAI', async (req, res) => {
    try {
        const phone = req.query.ApiPhone; // נחפש לפי מספר הטלפון
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle["מענה AI"];
        
        const rows = await sheet.getRows();
        // מחפשים מהסוף להתחלה כדי למצוא את השאלה האחרונה של המשתמש הזה
        let userRow = null;
        for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i].get("מספר שורה") === String(phone)) {
                userRow = rows[i];
                break;
            }
        }
        
        if (userRow && userRow.get("טקסט מסונן")) {
            const answer = userRow.get("טקסט מסונן");
            res.send(`id_list_message=t-${answer}`);
        } else {
            res.send("id_list_message=t-התשובה עדיין לא מוכנה נסה שוב");
        }
    } catch (error) { res.send("id_list_message=t-חלה שגיאה במשיכת התשובה"); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
