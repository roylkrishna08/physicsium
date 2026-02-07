const User = require('../models/User');

/**
 * Auto-setup admin user from environment variables
 * This runs on server startup to ensure admin access is always available
 * 
 * Environment Variables:
 * - ADMIN_USERNAME: Username for the admin account
 * - ADMIN_PASSWORD: Password for the admin account
 * 
 * The admin will be created with role 'owner' and email admin@physicsium.com
 */
async function setupAdmin() {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Skip if environment variables not set
        if (!adminUsername || !adminPassword) {
            console.log('⚠️  Admin credentials not found in environment variables');
            console.log('   Set ADMIN_USERNAME and ADMIN_PASSWORD to auto-create admin user');
            return;
        }

        // Generate email based on username to avoid conflicts
        const adminEmail = `${adminUsername}@physicsium.com`;

        // Check if admin user already exists by username OR email
        let adminUser = await User.findOne({
            $or: [
                { username: adminUsername },
                { email: adminEmail }
            ]
        });

        if (adminUser) {
            // Update existing admin user
            console.log(`🔄 Updating existing admin user: ${adminUsername}`);

            // Update password, email, and ensure role is owner
            adminUser.password = adminPassword; // Will be hashed by pre-save hook
            adminUser.email = adminEmail; // Update email if changed
            adminUser.username = adminUsername; // Ensure username is correct
            adminUser.role = 'owner';
            adminUser.isRestricted = false;
            await adminUser.save();

            console.log(`✅ Admin user updated successfully`);
        } else {
            // Create new admin user
            console.log(`🆕 Creating new admin user: ${adminUsername}`);

            adminUser = await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email: adminEmail,
                username: adminUsername,
                password: adminPassword, // Will be hashed by pre-save hook
                role: 'owner',
                isRestricted: false
            });

            console.log(`✅ Admin user created successfully`);
        }

        console.log(`📧 Admin login: ${adminUser.username} / ${adminUser.email}`);
        console.log(`🔐 Role: ${adminUser.role}`);

    } catch (error) {
        console.error('❌ Error setting up admin user:', error.message);
        // Don't crash the server, just log the error
    }
}

module.exports = setupAdmin;
