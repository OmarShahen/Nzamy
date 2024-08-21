module.exports = {
    APP_NAME: `RA'AYA`,
    PORT: process.env.APP_PORT,
    DB_URL: process.env.PROD_DB_URL,
    //DB_URL: process.env.DB_URL,
    SUPPORT_NUMBER: '+201555415331',
    GENDER: ['MALE', 'FEMALE'],
    ROLES: ['OWNER', 'DOCTOR', 'STAFF'],
    TYPES: ['EMPLOYEE', 'ADMIN'],
    SPECIALITIES_TYPES: ['MAIN', 'SUB'],
    EMAIL: {
        APP_MAIL: 'raayaeg@gmail.com',
        APP_MAIL_PASSWORD: process.env.APP_MAIL_PASSWORD,
        APP_MAIL_SERVICE: 'gmail'
    },
    SALT_ROUNDS: Number.parseInt(process.env.SALT_ROUNDS),
    SECRET_KEY: process.env.SECRET_KEY,
    NOTIFICATION_EMAIL: 'omarredaelsayedmohamed@gmail.com',
    LANGUAGES: ['en', 'ar'],
    TIME_UNIT: ['day', 'week', 'month'],
    WEEK_DAYS: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    PAYMENT_METHODS: ['CASH', 'CARD'],
    TRANSACTION_TYPE: ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'THEFT'],
    TABLE_STATUS: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'IN-PROGRESS', 'COMPLETED'],
    PRINTER_IP: 'tcp://192.168.123.100'
}