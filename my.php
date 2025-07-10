<?php
header('Content-Type: application/json'); // ប្រាប់ Browser ថាយើងកំពុងផ្ញើ JSON

// --- Configuration ---
// Bot Token របស់អ្នក (បានបញ្ចូលរួចរាល់)
$botToken = '8184862054:AAFqJQFFEX0AhYjEtOgXxO-OABJaVqTeISU';
// Chat ID របស់អ្នក (បានបញ្ចូលរួចរាល់)
$chatId = '7773002621';

// បើកការបង្ហាញរាល់ error សម្រាប់ Debugging (អាចបិទវិញពេលដាក់ប្រើប្រាស់ជាក់ស្តែង)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// បង្ហាញទិន្នន័យ POST និង File ដែលបាន Upload នៅក្នុង Browser (សម្រាប់ Debugging)
var_dump($_POST);
var_dump($_FILES);
// --- End Configuration ---

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = ['status' => 'error', 'message' => ''];

    // Collect text data from form
    $messageText = "🚨 ទម្រង់ថ្មីបានបំពេញ! 🚨\n\n";
    $messageText .= "ឈ្មោះ (ខ្មែរ): " . ($_POST['khmerName'] ?? 'N/A') . "\n";
    $messageText .= "Name (អង់គ្លេស): " . ($_POST['englishName'] ?? 'N/A') . "\n";
    $messageText .= "ទីកន្លែងកំណើត: " . ($_POST['birthplace'] ?? 'N/A') . "\n";
    $messageText .= "ភេទ: " . ($_POST['gender'] ?? 'N/A') . "\n";
    $messageText .= "ថ្ងៃ ខែ ឆ្នាំកំណើត: " . ($_POST['dob'] ?? 'N/A') . "\n";
    $messageText .= "សញ្ជាតិ: " . ($_POST['nationality'] ?? 'N/A') . "\n";
    $messageText .= "បច្ចុប្បន្នស្នាក់នៅ: " . ($_POST['currentAddress'] ?? 'N/A') . "\n";

    $filesToUpload = [];

    // Process file uploads - ទទួលយក File Input គ្រប់ប្រភេទដែលបាន Upload
    if (!empty($_FILES)) {
        foreach ($_FILES as $fieldName => $fileData) {
            // ពិនិត្យមើលថាតើ File បាន Upload ដោយជោគជ័យ និងជា File ពិតប្រាកដ
            if (isset($fileData['error']) && $fileData['error'] === UPLOAD_ERR_OK && isset($fileData['tmp_name']) && $fileData['tmp_name'] != '') {
                $filesToUpload[] = [
                    'name' => $fieldName, // ឈ្មោះរបស់ Input field (ឧទាហរណ៍: profilePic)
                    'tmp_name' => $fileData['tmp_name'],
                    'mime_type' => $fileData['type'],
                    'original_name' => $fileData['name'],
                    'label' => ucfirst($fieldName) // ប្រើឈ្មោះ Field ជា Label
                ];
            }
        }
    }

    // --- Send text message to Telegram ---
    $telegramApiUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $params = [
        'chat_id' => $chatId,
        'text' => $messageText,
        'parse_mode' => 'HTML' // ឬ 'MarkdownV2' អាស្រ័យលើអ្វីដែលអ្នកចង់ប្រើ
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $telegramApiUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch); // យក cURL error message
    curl_close($ch);

    if ($httpCode != 200 || !$result) {
        $response['message'] = 'Failed to send text message to Telegram.';
        // កត់ត្រា error លម្អិតទៅក្នុង Apache error_log
        error_log("Telegram API Error - Text Message: HTTP Code: {$httpCode}, Result: {$result}, cURL Error: {$curlError}");
        echo json_encode($response);
        exit; // បញ្ឈប់ Script ប្រសិនបើផ្ញើសារអត្ថបទបរាជ័យ
    }

    // --- Send files to Telegram ---
    foreach ($filesToUpload as $file) {
        $caption = $file['label'] . ": " . $file['original_name'];
        $telegramApiUrlPhoto = "https://api.telegram.org/bot{$botToken}/sendDocument"; // ប្រើ sendDocument សម្រាប់គ្រប់ប្រភេទ File

        // បង្កើត CURLFile object សម្រាប់ Upload
        $filePath = new CURLFile($file['tmp_name'], $file['mime_type'], $file['original_name']);

        $photoParams = [
            'chat_id' => $chatId,
            'document' => $filePath, // ប្រើ 'document' សម្រាប់ sendDocument
            'caption' => $caption
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $telegramApiUrlPhoto);
        curl_setopt(
            $ch,
            CURLOPT_HTTPHEADER,
            array(
                "Content-Type:multipart/form-data" // សំខាន់សម្រាប់ File Upload
            )
        );
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $photoParams);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch); // យក cURL error message
        curl_close($ch);

        if ($httpCode != 200 || !$result) {
            $response['message'] .= ' Failed to send ' . $file['label'] . ' to Telegram.';
            // កត់ត្រា error លម្អិតទៅក្នុង Apache error_log សម្រាប់ File Upload
            error_log("Telegram API Error - File: HTTP Code: {$httpCode}, Result: {$result}, cURL Error: {$curlError}");
        }
    }

    // Determine final response status
    if ($response['message'] === '') {
        $response = ['status' => 'success', 'message' => 'Form data and files sent to Telegram successfully.'];
    } else {
        $response['status'] = 'partial_success'; // មាន File ខ្លះមិនបានផ្ញើ
    }

    echo json_encode($response);

} else {
    // ប្រសិនបើ Request Method មិនមែនជា POST
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
}
?>