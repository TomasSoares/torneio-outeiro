# TODO — Quando tiver domínio

## 1. Apontar o DNS
No painel do teu registar de domínio, criar um A record:
```
@ → 161.97.149.208
```
Aguardar propagação (pode demorar até 24h, normalmente menos de 1h).

## 2. Atualizar o Nginx com o domínio
Na VPS, editar `/etc/nginx/sites-available/torneio`:
```nginx
server_name teudominio.com www.teudominio.com;
```
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Instalar o HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d teudominio.com -d www.teudominio.com
```
O Certbot configura o HTTPS e o redirect HTTP→HTTPS automaticamente.
O certificado renova-se sozinho — não precisas de fazer nada.

## 4. Ativar o cookie seguro
No `.env.local` da VPS, adicionar:
```
COOKIE_SECURE=true
```
```bash
pm2 restart torneio
```

## 5. Segurança da VPS (hardening)
- [ ] Criar utilizador não-root: `adduser torneio && usermod -aG sudo torneio`
- [ ] Desativar login SSH como root: `PermitRootLogin no` em `/etc/ssh/sshd_config`
- [ ] Instalar fail2ban: `apt install -y fail2ban`
- [ ] Atualizar o secret do GitHub Actions `VPS_USER` para o novo utilizador

## 6. Atualizar o GitHub Actions
No ficheiro `.github/workflows/deploy.yml`, atualizar o `VPS_USER` secret
para o novo utilizador não-root (se fizeres o passo 5).
