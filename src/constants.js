export const DB_NAME = 'messagingApp'

const UserRoles = {
    ADMIN: 'admin',
    MOTIVATOR: 'motivator',
    CLIENT: 'client',
}

const UserStatus = {
    ACTIVE: '',
    INACTIVE: '',
    PENDING: '',
}

const MessageStatus = {
    NEW: 'new',
    RESPONDED: 'responded',
    ACHIEVED: 'achieved',
}

const ResponseTypes = {
    TEXT: '',
    AUDIO: '',
    VIDEO: '',
}

module.exports = {
    UserRoles,
    UserStatus,
    MessageStatus,
    ResponseTypes,
}
