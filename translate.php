<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$text = $input['text'] ?? '';
$targetLang = $input['targetLang'] ?? '';

if (empty($text) || empty($targetLang)) {
    http_response_code(400);
    echo json_encode(['error' => 'Text and target language are required']);
    exit;
}

function translate($text, $source, $target) {
    $url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t';
    $url .= '&sl=' . urlencode($source);
    $url .= '&tl=' . urlencode($target);
    $url .= '&q=' . urlencode($text);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For easier local dev, strictly should be true
    
    // Fake headers to look like a browser if needed
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36');
    
    $response = curl_exec($ch);
    
    if (curl_errno($ch)) {
        return null; // Error
    }
    curl_close($ch);

    $data = json_decode($response, true);
    
    // The response structure is [[[ "translated_text", "original_text", ... ], ...], ...]
    if (!empty($data[0])) {
        $translatedText = '';
        foreach ($data[0] as $part) {
            if (isset($part[0])) {
                $translatedText .= $part[0];
            }
        }
        return $translatedText;
    }
    
    return null;
}

try {
    // 1. Translate to target language
    $translated = translate($text, 'en', $targetLang);
    if ($translated === null) {
        throw new Exception('Forward translation failed');
    }

    // 2. Translate back to English
    $backTranslated = translate($translated, $targetLang, 'en');
    if ($backTranslated === null) {
        throw new Exception('Back translation failed');
    }

    echo json_encode([
        'original' => $text,
        'translated' => $translated,
        'backTranslated' => $backTranslated,
        'targetLang' => $targetLang
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Translation failed: ' . $e->getMessage()]);
}
