<?php
// save_song.php
// Permite salvar o arquivo songs.yml atualizado pelo frontend

// Habilita CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recebe o corpo da requisição (YAML string)
    $yamlContent = file_get_contents('php://input');
    
    if (empty($yamlContent)) {
        echo json_encode(["status" => "error", "message" => "Conteúdo vazio recebido."]);
        exit;
    }
    
    // Salva no arquivo songs.yml
    $filePath = 'songs.yml';
    
    $bytesWritten = file_put_contents($filePath, $yamlContent);
    if ($bytesWritten !== false) {
        echo json_encode(["status" => "success", "message" => "songs.yml atualizado com sucesso!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Falha ao gravar no arquivo songs.yml. Verifique as permissões de escrita."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Método não suportado. Use POST."]);
}
?>
