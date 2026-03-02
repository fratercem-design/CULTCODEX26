# 🔮 Cult of Psyche - Complete User Guide

Welcome to the Cult of Psyche platform - your gateway to esoteric knowledge, personal spiritual practice, and mystical wisdom.

---

## 🌟 Getting Started

### Accessing the Platform
**URL:** https://cultcodex-2666.vercel.app

### First Time Login
1. Navigate to https://cultcodex-2666.vercel.app/login
2. Enter your credentials
3. Click "Sign In"

### Admin Access
- **Email:** `admin@cultofpsyche.com`
- **Password:** (Your secure password)
- **Dashboard:** https://cultcodex-2666.vercel.app/admin

---

## 📚 Platform Features

### 1. The Vault 🗝️
**Access Level:** Requires `vault_access` entitlement

The Vault contains premium esoteric content, mystical teachings, and sacred knowledge.

#### Browsing the Vault
1. Navigate to `/vault` from the main menu
2. Browse available content items
3. Click on any item to view full content
4. Use tags to filter content by topic

#### Vault Content Features
- Markdown-formatted content
- Tag-based organization
- Entitlement-based access control
- Rich media support (images, videos)

---

### 2. The Grimoire 📖
**Access Level:** Requires `grimoire_access` entitlement

The Grimoire is a living knowledge base with full revision history tracking.

#### Reading Grimoire Entries
1. Navigate to `/grimoire`
2. Browse available entries
3. Click on an entry to read full content
4. View revision history for any entry

#### Revision History
- Every edit is tracked
- View previous versions
- See who made changes and when
- Restore previous versions (admin only)

#### Accessing Revisions
1. Open any grimoire entry
2. Click "View Revisions"
3. Browse revision history
4. Click on any revision to view that version

---

### 3. Personal Journal 📝
**Access Level:** All authenticated users

Your private space for spiritual reflections, insights, and personal notes.

#### Creating Journal Entries
1. Navigate to `/journal`
2. Click "New Entry"
3. Write your entry (Markdown supported)
4. Click "Save"

#### Managing Entries
- **Edit:** Click "Edit" on any entry
- **Delete:** Click "Delete" (confirmation required)
- **Export:** Click "Export" to download all entries

#### Export Formats
- **JSON:** Machine-readable format
- **CSV:** Spreadsheet-compatible format

---

### 4. Ritual Tracking 🕯️
**Access Level:** All authenticated users

Track your ritual practices, ceremonies, and spiritual work.

#### Recording Rituals
1. Navigate to `/rituals`
2. Click "New Ritual"
3. Fill in ritual details:
   - Name
   - Description
   - Date performed
   - Notes (Markdown supported)
4. Click "Save"

#### Managing Rituals
- **Edit:** Update ritual details
- **Delete:** Remove ritual records
- **Export:** Download ritual history

#### Export Options
- **JSON:** Complete ritual data
- **CSV:** Tabular format for analysis

---

### 5. Admin Console 👑
**Access Level:** Requires `admin` entitlement

Comprehensive platform management interface.

#### Admin Dashboard
Navigate to `/admin` to access:
- Vault Management
- Grimoire Management
- User Management
- Audit Logs

---

## 🛠️ Admin Features

### Vault Management

#### Creating Vault Content
1. Go to `/admin/vault`
2. Click "Create New"
3. Fill in the form:
   - **Title:** Content title
   - **Slug:** URL-friendly identifier (e.g., `sacred-geometry`)
   - **Content:** Markdown-formatted content
   - **Required Entitlement:** Access level (optional)
   - **Tags:** Comma-separated tags
4. Click "Create"

#### Editing Vault Content
1. Find the content item
2. Click "Edit"
3. Modify fields
4. Click "Update"

#### Deleting Vault Content
1. Find the content item
2. Click "Delete"
3. Confirm deletion

#### Managing Assets
- Upload images, PDFs, and other media
- Reference assets in content using URLs
- Organize assets by type

---

### Grimoire Management

#### Creating Grimoire Entries
1. Go to `/admin/grimoire`
2. Click "Create New Entry"
3. Fill in:
   - **Title:** Entry title
   - **Slug:** URL identifier
   - **Content:** Markdown content
   - **Required Entitlement:** Access level
4. Click "Create"

#### Editing Grimoire Entries
1. Find the entry
2. Click "Edit"
3. Modify content
4. Click "Update"
5. **Note:** Every edit creates a new revision

#### Managing Revisions
- View complete revision history
- Compare versions
- Restore previous versions
- Track who made changes

#### Deleting Grimoire Entries
1. Find the entry
2. Click "Delete"
3. Confirm deletion
4. **Note:** All revisions are also deleted

---

### User Management

#### Viewing Users
1. Go to `/admin/users`
2. Browse all registered users
3. Click on any user to view details

#### Managing User Entitlements
1. Open user details page
2. View current entitlements
3. Grant new entitlements:
   - Click "Grant Entitlement"
   - Select entitlement type
   - Confirm
4. Revoke entitlements:
   - Click "Revoke" next to entitlement
   - Confirm

#### Available Entitlements
- **admin:** Full platform access
- **vault_access:** Access to Vault content
- **grimoire_access:** Access to Grimoire entries

---

### Audit Log Viewer

#### Accessing Audit Logs
1. Go to `/admin/audit`
2. View comprehensive activity log

#### Filtering Logs
- **By Action:** Login, entitlement changes, content edits, etc.
- **By Entity Type:** User, VaultContent, GrimoireEntry, etc.
- **By User:** Filter by specific user
- **By Date Range:** Custom date filtering

#### Audit Log Information
Each log entry shows:
- Timestamp
- User who performed action
- Action type
- Entity affected
- Detailed metadata
- IP address
- User agent

---

## 💳 Payment & Subscriptions

### Purchasing Access

#### Monthly Subscription
1. Navigate to checkout page
2. Click "Monthly Subscription"
3. Complete Stripe checkout
4. Entitlements granted automatically

#### Lifetime Access
1. Navigate to checkout page
2. Click "Lifetime Access"
3. Complete Stripe checkout
4. Permanent entitlements granted

### What You Get
- **Vault Access:** All premium content
- **Grimoire Access:** Complete knowledge base
- **Personal Tools:** Journal and ritual tracking
- **Regular Updates:** New content added regularly

---

## 🔐 Security & Privacy

### Your Data
- **Journal Entries:** Completely private (only you can see)
- **Rituals:** Personal and private
- **Account Info:** Securely encrypted
- **Passwords:** Hashed with bcrypt (never stored in plain text)

### Security Features
- HTTPS encryption
- Secure session management
- Rate limiting on login attempts
- Comprehensive audit logging
- Input validation and sanitization

### Privacy Policy
- We don't sell your data
- Minimal data collection
- Audit logs for security only
- You can export your data anytime

---

## 📱 Using the Platform

### Navigation
- **Home:** Platform landing page
- **Vault:** Premium content library
- **Grimoire:** Knowledge base
- **Journal:** Personal journal
- **Rituals:** Ritual tracking
- **Admin:** Admin console (admin only)

### Markdown Support
Most content fields support Markdown formatting:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- Bullet list
- Item 2

1. Numbered list
2. Item 2

[Link text](https://example.com)

![Image](https://example.com/image.jpg)
```

### Keyboard Shortcuts
- **Ctrl/Cmd + S:** Save (in forms)
- **Esc:** Close modals
- **Tab:** Navigate form fields

---

## 🆘 Troubleshooting

### Can't Login
1. Verify email and password
2. Check for typos
3. Clear browser cache
4. Try incognito/private mode
5. Contact admin if issue persists

### Content Not Loading
1. Refresh the page
2. Check your internet connection
3. Verify you have required entitlements
4. Clear browser cache
5. Try a different browser

### Permission Denied
- Verify you have the required entitlement
- Contact admin to request access
- Check audit logs for entitlement changes

### Export Not Working
1. Ensure you have entries to export
2. Check browser download settings
3. Try a different browser
4. Contact support if issue persists

---

## 💡 Tips & Best Practices

### For Users

#### Journal Writing
- Write regularly for best results
- Use tags for organization
- Export backups periodically
- Be honest and reflective

#### Ritual Tracking
- Record rituals immediately after performing
- Include detailed notes
- Track patterns over time
- Export data for analysis

#### Content Consumption
- Take notes in your journal
- Revisit content multiple times
- Explore related tags
- Share insights (if permitted)

### For Admins

#### Content Creation
- Use clear, descriptive titles
- Create meaningful slugs
- Add relevant tags
- Set appropriate entitlements
- Preview before publishing

#### User Management
- Grant entitlements carefully
- Review audit logs regularly
- Respond to user requests promptly
- Monitor platform usage

#### Security
- Change default passwords immediately
- Review audit logs weekly
- Monitor failed login attempts
- Keep entitlements up to date

---

## 🔄 Regular Maintenance

### Weekly Tasks
- Review new journal entries (personal)
- Check ritual tracking progress
- Browse new vault content
- Read grimoire updates

### Monthly Tasks (Admin)
- Review audit logs
- Check user entitlements
- Update content
- Verify backup integrity
- Review platform analytics

### Quarterly Tasks (Admin)
- Security audit
- Content review and updates
- User feedback review
- Feature planning

---

## 📞 Support & Contact

### Getting Help
1. Check this user guide
2. Review platform documentation
3. Check audit logs (admin)
4. Contact platform administrator

### Reporting Issues
- Describe the problem clearly
- Include steps to reproduce
- Note any error messages
- Provide browser/device info

### Feature Requests
- Submit via admin console
- Describe desired functionality
- Explain use case
- Provide examples if possible

---

## 🎓 Advanced Features

### API Access
The platform provides REST APIs for programmatic access:
- Authentication endpoints
- Content retrieval
- CRUD operations
- Export functionality

### Webhooks
- Stripe payment webhooks
- Custom event webhooks (future)
- Integration capabilities

### Bulk Operations
- Bulk user import (admin)
- Bulk content upload (admin)
- Batch entitlement changes (admin)

---

## 🌙 Mystical Features

### Occult Symbolism
- Sacred geometry in design
- Esoteric color schemes
- Mystical typography
- Symbolic navigation

### Ritual Calendar
- Track moon phases
- Note astrological events
- Plan ritual timing
- Seasonal celebrations

### Meditation Timer
- Built-in timer for practices
- Customizable durations
- Sound notifications
- Session tracking

---

## 📊 Analytics & Insights

### Personal Analytics
- Journal entry frequency
- Ritual practice patterns
- Content consumption habits
- Progress tracking

### Admin Analytics
- User engagement metrics
- Content popularity
- Entitlement distribution
- Platform usage statistics

---

## 🔮 Future Features

### Planned Enhancements
- Mobile app (iOS/Android)
- Advanced search
- Community features
- AI-powered recommendations
- Multi-language support
- Voice journal entries
- Ritual templates
- Guided meditations

### Beta Features
- Social sharing (opt-in)
- Collaborative grimoire editing
- Live ritual sessions
- Virtual study groups

---

## 📖 Glossary

- **Vault:** Premium content library
- **Grimoire:** Knowledge base with revision tracking
- **Entitlement:** Permission to access specific features
- **Slug:** URL-friendly identifier for content
- **Revision:** Historical version of content
- **Audit Log:** Record of platform activities
- **Markdown:** Text formatting syntax
- **JWT:** JSON Web Token (authentication)

---

## ✨ Quick Reference

### Common URLs
- Login: `/login`
- Vault: `/vault`
- Grimoire: `/grimoire`
- Journal: `/journal`
- Rituals: `/rituals`
- Admin: `/admin`

### Common Actions
- **Create:** Click "New" or "Create" button
- **Edit:** Click "Edit" button on item
- **Delete:** Click "Delete" button (confirm)
- **Export:** Click "Export" button
- **Save:** Click "Save" or press Ctrl/Cmd+S

### Entitlement Levels
1. **Public:** No login required
2. **Authenticated:** Login required
3. **Vault Access:** Premium content
4. **Grimoire Access:** Knowledge base
5. **Admin:** Full platform control

---

*Guide Version: 1.0.0*  
*Last Updated: March 3, 2026*  
*Platform: Cult of Psyche Vault + Grimoire*

🔮 *May your journey through the mysteries be illuminating* 🔮
