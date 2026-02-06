# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Physicsium seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to [your-email@example.com] with:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact of the vulnerability
4. Any suggestions for fixing the issue

You should receive a response within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity.

## Security Best Practices

### For Developers

1. **Never commit sensitive data**: Keep `.env` files out of version control
2. **Use environment variables**: Store all secrets and API keys in environment variables
3. **Keep dependencies updated**: Run `npm audit` regularly and update vulnerable packages
4. **Input validation**: Always validate and sanitize user inputs
5. **Authentication**: Use strong JWT secrets (minimum 32 characters)
6. **HTTPS only**: Always use HTTPS in production
7. **CORS configuration**: Restrict CORS to known origins only
8. **Rate limiting**: Implement rate limiting on all API endpoints
9. **Password security**: Use bcrypt with minimum 10 rounds for hashing
10. **SQL/NoSQL injection**: Use parameterized queries and sanitization middleware

### For Deployment

1. **MongoDB Atlas**:
   - Enable IP whitelist
   - Use strong database passwords
   - Enable encryption at rest
   - Enable audit logging
   - Regular backups

2. **Render (Backend)**:
   - Set all environment variables as secrets
   - Enable auto-deploy only from protected branches
   - Use health checks
   - Monitor logs regularly

3. **Vercel (Frontend)**:
   - Set API URL environment variable
   - Enable HTTPS redirect
   - Configure security headers
   - Protect preview deployments

## Known Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT authentication with expiration
- ✅ Input validation and sanitization
- ✅ NoSQL injection prevention
- ✅ XSS protection
- ✅ CORS restrictions
- ✅ Rate limiting on authentication endpoints
- ✅ HTTP Parameter Pollution prevention
- ✅ Security headers (Helmet.js, CSP, HSTS)
- ✅ File upload restrictions (type and size)
- ✅ Account lockout on restricted users

## Security Checklist for Production

Before deploying to production, ensure:

- [ ] All environment variables are set and secured
- [ ] JWT_SECRET is cryptographically random (32+ characters)
- [ ] MongoDB Atlas IP whitelist is configured
- [ ] CORS is restricted to production URLs only
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Rate limiting is active
- [ ] File upload limits are in place
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies have no known vulnerabilities
- [ ] Backup strategy is implemented
- [ ] Monitoring and alerting are configured

## Updates

This security policy was last updated on February 6, 2026.
