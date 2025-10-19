// pdf-boarding-pass.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const QRCode = require('qrcode');

class BoardingPassPDF {
    constructor() {
        this.doc = new PDFDocument({
            size: [85, 54], // Standard boarding pass size in mm
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });
    }

    generatePass(flightData, outputPath) {
        return new Promise(async (resolve, reject) => {
            try {
                const stream = fs.createWriteStream(outputPath);
                this.doc.pipe(stream);

                // Background
                this.doc.rect(0, 0, 85, 54)
                    .fillColor('#005a9e')
                    .fill();

                // Header
                this.doc.rect(0, 0, 85, 10)
                    .fillColor('#2c3e50')
                    .fill();

                this.doc.fillColor('#ffffff')
                    .fontSize(8)
                    .font('Helvetica-Bold')
                    .text(flightData.airline.name, 42.5, 4, { align: 'center' })
                    .fontSize(6)
                    .text('BOARDING PASS', 42.5, 7, { align: 'center' });

                // Flight information
                this.doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .text(flightData.departure.code, 15, 18)
                    .text(flightData.arrival.code, 60, 18);

                this.doc.fontSize(6)
                    .font('Helvetica')
                    .text(flightData.departure.city, 15, 22)
                    .text(flightData.arrival.city, 60, 22)
                    .text('DEPARTURE', 15, 25)
                    .text('ARRIVAL', 60, 25);

                // Arrow and flight number
                this.doc.fontSize(10)
                    .text('→', 42.5, 20, { align: 'center' })
                    .fontSize(6)
                    .text(`${flightData.airline.code}${flightData.flightNumber}`, 42.5, 25, { align: 'center' });

                // Passenger information
                this.doc.roundedRect(5, 28, 75, 8, 1)
                    .fillOpacity(0.1)
                    .fillColor('#ffffff')
                    .fill()
                    .fillOpacity(1);

                this.doc.fontSize(5)
                    .text('PASSENGER', 8, 31)
                    .fontSize(8)
                    .font('Helvetica-Bold')
                    .text(flightData.passenger.name.toUpperCase(), 8, 35);

                // Flight details
                const details = [
                    { label: 'DATE', value: flightData.departure.date, x: 5 },
                    { label: 'FLIGHT', value: `${flightData.airline.code}${flightData.flightNumber}`, x: 30 },
                    { label: 'SEAT', value: flightData.passenger.seat, x: 55 },
                    { label: 'DEPARTS', value: flightData.departure.time, x: 5, y: 45 },
                    { label: 'GATE', value: flightData.boarding.gate, x: 30, y: 45 },
                    { label: 'BOARDS', value: flightData.boarding.time, x: 55, y: 45 }
                ];

                this.doc.fontSize(5)
                    .font('Helvetica');
                
                details.forEach(detail => {
                    this.doc.text(detail.label, detail.x, detail.y || 41)
                        .fontSize(7)
                        .font('Helvetica-Bold')
                        .text(detail.value, detail.x, (detail.y || 41) + 4)
                        .fontSize(5)
                        .font('Helvetica');
                });

                // Barcode area
                this.doc.rect(0, 49, 85, 5)
                    .fillColor('#ffffff')
                    .fill()
                    .fillColor('#000000')
                    .fontSize(4)
                    .font('Courier')
                    .text(flightData.barcode, 42.5, 51, { align: 'center' });

                // Add QR Code if needed
                if (flightData.qrCode) {
                    const qrCodeBuffer = await QRCode.toBuffer(flightData.barcode, {
                        width: 30,
                        margin: 1
                    });
                    
                    this.doc.image(qrCodeBuffer, 27, 15, { width: 30 });
                }

                this.doc.end();

                stream.on('finish', () => resolve(outputPath));
                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }
}

// Example usage
const boardingPass = new BoardingPassPDF();

const flightData = {
    airline: {
        name: 'SAUDIA',
        code: 'SV'
    },
    flightNumber: '2501',
    departure: {
        code: 'JED',
        city: 'JEDDAH',
        date: '15 NOV 2024',
        time: '14:30'
    },
    arrival: {
        code: 'DEL',
        city: 'DELHI',
        date: '15 NOV 2024',
        time: '18:45'
    },
    passenger: {
        name: 'ALI/RAHMAN',
        seat: '12A'
    },
    boarding: {
        gate: 'B12',
        time: '13:45'
    },
    barcode: 'M1ALI/RAHMAN SV2501 012A JEDDEL'
};

boardingPass.generatePass(flightData, './boarding-pass.pdf')
    .then(filePath => console.log(`PDF generated: ${filePath}`))
    .catch(error => console.error('Error:', error));