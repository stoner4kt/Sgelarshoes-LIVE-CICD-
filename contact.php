<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Get the business email you created in cPanel
    $to = "info@sgelarshoes.co.za"; 
    $subject = "New Contact Form Inquiry";

    // 2. Collect and clean the form data
    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $message = trim($_POST["message"]);

    // 3. Prepare the email content
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";

    // 4. Set the email headers
    $headers = "From: $name <$email>";

    // 5. Send the email
    if (mail($to, $subject, $email_content, $headers)) {
        // Redirect to a thank-you page or show success
        echo "<script>alert('Thank you! Your message has been sent.'); window.location.href='index.html';</script>";
    } else {
        echo "Oops! Something went wrong and we couldn't send your message.";
    }
} else {
    echo "There was a problem with your submission, please try again.";
}
?>