package com.secure.policerecord.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.secure.policerecord.model.Certificate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class CertificatePdfService {

    private static final DeviceRgb INK = new DeviceRgb(20, 22, 26);
    private static final DeviceRgb INK_SOFT = new DeviceRgb(75, 79, 87);
    private static final DeviceRgb BORDER_COLOR = new DeviceRgb(180, 182, 186);

    public byte[] generateCertificatePdf(
            Certificate certificate,
            String citizenFullName,
            String citizenAddress,
            String certificateTypeLabel,
            Map<String, String> details,
            String officerFullName,
            String badgeNumber,
            String stationCode,
            byte[] qrPngBytes
    ) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document doc = new Document(pdfDoc, PageSize.A4);
            doc.setMargins(36, 36, 36, 36);

            Table outer = new Table(1).useAllAvailableWidth();
            Cell frame = new Cell();
            frame.setBorder(new SolidBorder(BORDER_COLOR, 1.5f));
            frame.setPadding(30);

            Paragraph emblem = new Paragraph("SPRS")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(20)
                    .setBold()
                    .setFontColor(INK)
                    .setMarginBottom(2);

            Paragraph title = new Paragraph("SECURE POLICE RECORD SYSTEM")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(INK)
                    .setMarginBottom(2);

            Paragraph subtitle = new Paragraph(certificateTypeLabel)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(12.5f)
                    .setItalic()
                    .setFontColor(INK_SOFT)
                    .setMarginBottom(14);

            frame.add(emblem);
            frame.add(title);
            frame.add(subtitle);
            frame.add(new LineSeparator(new SolidLine(1f)).setMarginBottom(16));

            Paragraph body = new Paragraph()
                    .add("This is to certify that ")
                    .add(new Text(citizenFullName != null ? citizenFullName : "the applicant").setBold())
                    .add(citizenAddress != null ? (", residing at " + citizenAddress + ",") : ",")
                    .add(" has been issued the following, subject to verification of documents and records as per the applicable procedures of the Secure Police Record System.")
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setFontSize(11)
                    .setFontColor(INK)
                    .setMarginBottom(18);
            frame.add(body);

            Table detailsTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth()
                    .setMarginBottom(24);
            for (Map.Entry<String, String> entry : details.entrySet()) {
                detailsTable.addCell(labelCell(entry.getKey()));
                detailsTable.addCell(valueCell(entry.getValue()));
            }
            frame.add(detailsTable);

            Table bottomRow = new Table(UnitValue.createPercentArray(new float[]{1.3f, 1}))
                    .useAllAvailableWidth();

            Cell sigCell = new Cell().setBorder(Border.NO_BORDER);
            sigCell.add(new Paragraph("_______________________________").setMarginBottom(2));
            sigCell.add(new Paragraph(officerFullName != null ? officerFullName : "Authorized Officer")
                    .setBold().setFontSize(11).setMarginBottom(1));
            if (badgeNumber != null) {
                sigCell.add(new Paragraph("Badge No: " + badgeNumber).setFontSize(9.5f).setFontColor(INK_SOFT).setMarginBottom(1));
            }
            if (stationCode != null) {
                sigCell.add(new Paragraph("Station: " + stationCode).setFontSize(9.5f).setFontColor(INK_SOFT).setMarginBottom(1));
            }
            sigCell.add(new Paragraph("Authorized Signatory").setFontSize(9.5f).setFontColor(INK_SOFT));
            bottomRow.addCell(sigCell);

            Cell qrCell = new Cell().setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            if (qrPngBytes != null) {
                Image qrImage = new Image(ImageDataFactory.create(qrPngBytes)).setWidth(80).setHeight(80);
                qrCell.add(qrImage);
                qrCell.add(new Paragraph("Scan to verify authenticity").setFontSize(8).setFontColor(INK_SOFT).setMarginTop(4));
            }
            bottomRow.addCell(qrCell);

            frame.add(bottomRow);

            Paragraph footer = new Paragraph(
                    "Issued under the Secure Police Record System, developed as an internship project at the Central Detective Training Institute. "
                            + "Certificate ID: " + certificate.getCertificateId())
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8)
                    .setFontColor(INK_SOFT)
                    .setMarginTop(22);
            frame.add(footer);

            outer.addCell(frame);
            doc.add(outer);
            doc.close();

            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate certificate PDF", e);
        }
    }

    private Cell labelCell(String label) {
        return new Cell()
                .setBorder(Border.NO_BORDER)
                .add(new Paragraph(label).setFontSize(9.5f).setFontColor(INK_SOFT).setBold())
                .setPaddingBottom(8);
    }

    private Cell valueCell(String value) {
        return new Cell()
                .setBorder(Border.NO_BORDER)
                .add(new Paragraph(value != null ? value : "—").setFontSize(11).setFontColor(INK))
                .setPaddingBottom(8);
    }
}