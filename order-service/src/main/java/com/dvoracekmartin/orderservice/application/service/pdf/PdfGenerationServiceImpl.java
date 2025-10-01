package com.dvoracekmartin.orderservice.application.service.pdf;

import com.dvoracekmartin.common.dto.cart.CartItemType;
import com.dvoracekmartin.common.dto.customer.ResponseCustomerDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import com.dvoracekmartin.common.event.translation.TranslationGetOrDeleteEvent;
import com.dvoracekmartin.common.event.translation.TranslationObjectsEnum;
import com.dvoracekmartin.orderservice.application.service.customer.CustomerClient;
import com.dvoracekmartin.orderservice.application.service.product.CatalogClient;
import com.dvoracekmartin.orderservice.domain.model.Order;
import com.dvoracekmartin.orderservice.domain.model.OrderItem;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdfGenerationServiceImpl implements PdfGenerationService {

    private final CustomerClient customerClient;
    private final CatalogClient catalogClient;
    private final WebClient translationWebClient;
    private final WebClient catalogWebClient;

    private static TranslationGetOrDeleteEvent createRequestForTranslationGetOrDelete(Long elementId, TranslationObjectsEnum elementType) {
        return new TranslationGetOrDeleteEvent(
                elementType,
                elementId
        );
    }
    public ResponseMixtureDTO getMixtureById(Long id) {
        return translationWebClient.get()
                .uri("/mixtures/{id}", id)
                .retrieve()
                .bodyToMono(ResponseMixtureDTO.class)
                .block();
    }


    private Map<String, LocalizedField> getTranslationMap(TranslationGetOrDeleteEvent translationGetOrDeleteEvent) {
        return translationWebClient.post()
                .uri("/get")
                .bodyValue(translationGetOrDeleteEvent)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, LocalizedField>>() {
                })
                .block();
    }

    public byte[] generateInvoice(Order order, String selectedLocale) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Set up fonts
                PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font headerFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font normalFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                // Add title
                contentStream.beginText();
                contentStream.setFont(titleFont, 18);
                contentStream.newLineAtOffset(100, 750);
                contentStream.showText("INVOICE" + " #" + String.format("%d%05d", LocalDateTime.now().getYear(), order.getOrderYearOrderCounter()));
                contentStream.endText();

                // Add order details
                contentStream.beginText();
                contentStream.setFont(headerFont, 12);
                contentStream.newLineAtOffset(100, 700);
                contentStream.showText("Order Details");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(normalFont, 10);
                contentStream.newLineAtOffset(100, 680);
                contentStream.showText("Order Date: " +
                        order.getOrderDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
                contentStream.endText();

                // Add customer details
                contentStream.beginText();
                contentStream.setFont(headerFont, 12);
                contentStream.newLineAtOffset(100, 620);
                contentStream.showText("Customer Details");
                contentStream.endText();

                // Get Customer by ID
                ResponseCustomerDTO responseCustomerDTO = customerClient.getCustomerById(order.getCustomerId());

                contentStream.beginText();
                contentStream.setFont(normalFont, 10);
                contentStream.newLineAtOffset(100, 600);
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("Name: " +
                        responseCustomerDTO.firstName() + " " + responseCustomerDTO.lastName());
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("Email: " + responseCustomerDTO.email());
                contentStream.endText();

                // Add items table header
                contentStream.beginText();
                contentStream.setFont(headerFont, 10);
                contentStream.newLineAtOffset(100, 520);
                contentStream.showText("Product");
                contentStream.newLineAtOffset(200, 0);
                contentStream.showText("Quantity");
                contentStream.newLineAtOffset(80, 0);
                contentStream.showText("Price");
                contentStream.newLineAtOffset(80, 0);
                contentStream.showText("Total");
                contentStream.endText();

                // Add items
                int yPosition = 500;
                String itemName = "";
                Double itemPrice = 0D;
                for (OrderItem item : order.getItems()) {
                    if (item.getItemType().equals(CartItemType.PRODUCT.name())) {
                        ResponseProductDTO responseProductDTO = catalogClient.getProductById(item.getItemId()).getBody();
                        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(responseProductDTO.getId(), TranslationObjectsEnum.PRODUCT));
                        if (translationMap != null) {
                            itemName = translationMap.get(selectedLocale).getName();
                        }
                        itemPrice = responseProductDTO.getPrice();
                    } else if (item.getItemType().equals(CartItemType.MIXTURE.name())) {
                        ResponseMixtureDTO responseMixtureDTO = catalogClient.getMixtureById(item.getItemId()).getBody();
                        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(responseMixtureDTO.getId(), TranslationObjectsEnum.MIXTURE));
                        if (translationMap != null) {
                            LocalizedField localizedField = translationMap.get(selectedLocale);
                            if (localizedField == null) {
                                // user-defined mixture
                                itemName = responseMixtureDTO.getName();
                            } else {
                                itemName = localizedField.getName();
                            }
                            itemPrice = responseMixtureDTO.getPrice();
                        }
                    }
                    contentStream.beginText();
                    contentStream.setFont(normalFont, 10);
                    contentStream.newLineAtOffset(100, yPosition);
                    contentStream.showText(truncateText(itemName, 30));
                    contentStream.newLineAtOffset(200, 0);
                    contentStream.showText(String.valueOf(item.getQuantity()));
                    contentStream.newLineAtOffset(80, 0);
                    contentStream.showText("$" + String.format("%.2f", itemPrice));
                    contentStream.newLineAtOffset(80, 0);
                    contentStream.showText("$" + String.format("%.2f", itemPrice * item.getQuantity()));
                    contentStream.endText();
                    yPosition -= 15;
                }

                // Add summary
                contentStream.beginText();
                contentStream.setFont(headerFont, 12);
                contentStream.newLineAtOffset(100, yPosition - 30);
                contentStream.showText("Order Summary");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(normalFont, 10);
                contentStream.newLineAtOffset(100, yPosition - 50);
                contentStream.showText("Subtotal: $" + String.format("%.2f", order.getCartTotal()));
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("Shipping: $" + String.format("%.2f", order.getShippingCost()));
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("Total: $" + String.format("%.2f", order.getFinalTotal()));
                contentStream.endText();

                // Add payment method
                contentStream.beginText();
                contentStream.setFont(normalFont, 10);
                contentStream.newLineAtOffset(100, yPosition - 100);
                contentStream.showText("Payment Method: " + order.getPaymentMethod());
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("Shipping Method: " + order.getShippingMethod());
                contentStream.endText();
            }

            document.save(outputStream);
            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate PDF invoice", e);
        }
    }

    private String truncateText(String text, int maxLength) {
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }
}
