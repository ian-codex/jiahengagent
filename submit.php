<?php
// ============================================================
// 吉邦精密官网 · 询盘接收接口
// 联系页表单提交到这里 → 通过 163 SMTP 发送邮件到指定邮箱
// 依赖同目录下的 config.php（需先填写邮箱授权码）
// ============================================================

error_reporting(0);
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function json_out($ok, $msg) {
  echo json_encode(array('ok' => $ok, 'message' => $msg), JSON_UNESCAPED_UNICODE);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_out(false, '请求方式不正确，请使用表单正常提交。');
}

// 读取提交内容（兼容 JSON 与普通表单两种格式）
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

$name     = trim((string)($data['name'] ?? ''));
$company  = trim((string)($data['company'] ?? ''));
$phone    = trim((string)($data['phone'] ?? ''));
$email    = trim((string)($data['email'] ?? ''));
$industry = trim((string)($data['industry'] ?? ''));
$message  = trim((string)($data['message'] ?? ''));

if ($name === '')  { json_out(false, '请填写您的姓名。'); }
if ($phone === '') { json_out(false, '请填写联系电话。'); }

$subject = '=?UTF-8?B?' . base64_encode('【吉邦精密官网】' . $name . ' 的询盘') . '?=';

$body  = "您收到一条来自吉邦精密官网的新询盘：\n\n";
$body .= "姓    名：{$name}\n";
if ($company !== '') { $body .= "公    司：{$company}\n"; }
$body .= "联系电话：{$phone}\n";
if ($email !== '')    { $body .= "联系邮箱：{$email}\n"; }
if ($industry !== '') { $body .= "合作领域：{$industry}\n"; }
$body .= "\n需求描述：\n{$message}\n\n";
$body .= "—— 此邮件由吉邦精密官网联系表单自动发送 ——";

$ok = smtp_send(
  $CFG['smtp_host'],
  (int)$CFG['smtp_port'],
  $CFG['smtp_user'],
  $CFG['smtp_pass'],
  $CFG['from_email'],
  $CFG['to_email'],
  $subject,
  $body
);

if ($ok) {
  json_out(true, '感谢您的留言！您的询盘已发送至吉邦精密，我们会尽快与您联系。');
}
json_out(false, '发送失败，请稍后重试，或直接致电 18198482880（高工）。');

// ------------------------------------------------------------
// 极简 SMTP 客户端（无需安装任何扩展/组件，PHP 自带即可运行）
// ------------------------------------------------------------

function smtp_read($conn) {
  $last = '';
  while (($line = fgets($conn, 515)) !== false) {
    $last = $line;
    if (isset($line[3]) && $line[3] === ' ') { break; }
  }
  return trim((string)$last);
}

function smtp_cmd($conn, $cmd, $expect) {
  fwrite($conn, $cmd . "\r\n");
  $resp = smtp_read($conn);
  return ($resp !== '' && (int)substr($resp, 0, 3) === $expect);
}

function smtp_send($host, $port, $user, $pass, $from, $to, $subject, $body) {
  $useSsl = in_array($port, array(465, 994), true);
  $remote = ($useSsl ? 'ssl://' : 'tcp://') . $host . ':' . $port;
  $conn = @stream_socket_client($remote, $errno, $errstr, 20);
  if (!$conn) { return false; }
  stream_set_timeout($conn, 20);

  $resp = smtp_read($conn);                 // 220 欢迎语
  if (!preg_match('/^220/', $resp)) { fclose($conn); return false; }

  $ehlo = 'EHLO ' . (isset($_SERVER['SERVER_NAME']) && $_SERVER['SERVER_NAME'] !== '' ? $_SERVER['SERVER_NAME'] : 'localhost');
  if (!smtp_cmd($conn, $ehlo, 250)) { fclose($conn); return false; }

  if (!$useSsl) {                            // 25 端口走 STARTTLS 加密
    if (!smtp_cmd($conn, 'STARTTLS', 220)) { fclose($conn); return false; }
    if (!stream_socket_enable_crypto($conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) { fclose($conn); return false; }
    if (!smtp_cmd($conn, $ehlo, 250)) { fclose($conn); return false; }
  }

  if (!smtp_cmd($conn, 'AUTH LOGIN', 334)) { fclose($conn); return false; }
  if (!smtp_cmd($conn, base64_encode($user), 334)) { fclose($conn); return false; }
  if (!smtp_cmd($conn, base64_encode($pass), 235)) { fclose($conn); return false; }

  if (!smtp_cmd($conn, 'MAIL FROM:<' . $from . '>', 250)) { fclose($conn); return false; }
  if (!smtp_cmd($conn, 'RCPT TO:<' . $to . '>', 250)) { fclose($conn); return false; }
  if (!smtp_cmd($conn, 'DATA', 354)) { fclose($conn); return false; }

  $headers  = "From: " . $from . "\r\n";
  $headers .= "To: " . $to . "\r\n";
  $headers .= "Subject: " . $subject . "\r\n";
  $headers .= "Date: " . date('r') . "\r\n";
  $headers .= "MIME-Version: 1.0\r\n";
  $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
  $headers .= "Content-Transfer-Encoding: 8bit\r\n";
  $headers .= "X-Mailer: Jibang-Site\r\n";

  $mail = str_replace("\r\n", "\n", $headers . "\r\n" . $body);  // 统一换行为 \n
  $mail = preg_replace('/^\./m', '..', $mail);                   // 行首点号转义
  $mail = str_replace("\n", "\r\n", $mail);                      // 转回 SMTP 要求的 CRLF

  fwrite($conn, $mail . "\r\n.\r\n");
  $resp = smtp_read($conn);
  $ok = (preg_match('/^250/', $resp) === 1);
  smtp_cmd($conn, 'QUIT', 221);
  fclose($conn);
  return $ok;
}