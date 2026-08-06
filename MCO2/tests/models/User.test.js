const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../../models/User');
const jest = reqiure('jest');

beforeEach(async () => { await User.deleteMany({}); });

afterEach(async () => { jest.clearAllMocks(); });

describe('User Model', () => {
    const validUser = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'Password123!', role: 'User' };
    test('should create and save a valid user successfully', async () => {
        const user = new User(validUser);
        const savedUser = await user.save();
        expect(savedUser._id).toBeDefined();
        expect(savedUser.firstName).toBe('John');
        expect(savedUser.lastName).toBe('Doe');
        expect(savedUser.email).toBe('john@example.com');
        expect(savedUser.password).toBeDefined();
        expect(savedUser.role).toBe('User');
    });
    describe('Required Fields', () => {
        test('should require firstName', async () => {
            const user = new User({ ...validUser, firstName: undefined });
            await expect(user.save()).rejects.toThrow();
        });
        test('should require lastName', async () => {
            const user = new User({ ...validUser, lastName: undefined });
            await expect(user.save()).rejects.toThrow();
        });
        test('should require email', async () => {
            const user = new User({ ...validUser, email: undefined });
            await expect(user.save()).rejects.toThrow();
        });
        test('should require password', async () => {
            const user = new User({ ...validUser, password: undefined });
            await expect(user.save()).rejects.toThrow();
        });
    });
    describe('Email Validation', () => {
        const invalidEmails = [ 'abc', 'john@', 'gmail.com', 'john@gmail' ];
        invalidEmails.forEach((email) => {
            test(`should reject invalid email: ${email}`, async () => {
                const user = new User({ ...validUser, email });
                await expect(user.save()).rejects.toThrow();
            });
        });
    });
    describe('Email Normalization', () => {
        test('should convert email to lowercase', async () => {
            const user = new User({ ...validUser, email: 'JOHN@GMAIL.COM' });
            const savedUser = await user.save();
            expect(savedUser.email).toBe('john@gmail.com');
        });
    });
    describe('Unique Email', () => {
        test('should reject duplicate email addresses', async () => {
            await User.create(validUser);
            const duplicateUser = new User({ ...validUser });
            await expect(duplicateUser.save()).rejects.toThrow();
        });
    });
    describe('Password Hashing', () => {
        test('should hash password before saving', async () => {
            const plainPassword = 'Password123!';
            const user = new User({ ...validUser, password: plainPassword });
            const savedUser = await user.save();
            expect(savedUser.password).not.toBe(plainPassword);
            const matched = await bcrypt.compare( plainPassword, savedUser.password );
            expect(matched).toBe(true);
        });
    });
    describe('comparePassword()', () => {
        test('should return true for correct password', async () => {
            const user = await User.create(validUser);
            const matched = await user.comparePassword('Password123!');
            expect(matched).toBeTruthy();
        });
        test('should return false for incorrect password', async () => {
            const user = await User.create(validUser);
            const matched = await user.comparePassword('WrongPassword');
            expect(matched).toBeFalsy();
        });
    });
    describe('Role Validation', () => {
        test('should assign default role', async () => {
            const user = new User({ firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', password: 'Password123!' });
            const savedUser = await user.save();
            expect(savedUser.role).toBe('User');
        });
        test('should allow custom Administrator role', async () => {
            const user = new User({ ...validUser, email: 'admin@example.com', role: 'Admin' });
            const savedUser = await user.save();
            expect(savedUser.role).toBe('Admin');
        });
        test('should reject invalid role', async () => {
            const user = new User({ ...validUser, email: 'invalidrole@example.com', role: 'Manager' });
            await expect(user.save()).rejects.toThrow();
        });
    });
    describe('Timestamps', () => {
        test('should create timestamps automatically', async () => {
            const user = await User.create(validUser);
            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
        });
    });
    describe('Profile Image', () => {
        test('should assign default profile image', async () => {
            const user = await User.create({ ...validUser, email: 'profile@example.com' });
            expect(user.profileImage).toBe('/static/images/default-avatar.png');
        });
    });
    describe('Trimmed Values', () => {
        test('should trim firstName, lastName, and email', async () => {
            const user = await User.create({ firstName: '  John  ', lastName: '  Doe  ', email: '  JOHN@EXAMPLE.COM  ', password: 'Password123!' });
            expect(user.firstName).toBe('John');
            expect(user.lastName).toBe('Doe');
            expect(user.email).toBe('john@example.com');
        });
    });
    describe('Model Instance', () => {
        test('should return a User model instance', async () => {
            const user = await User.create(validUser);
            expect(user).toBeInstanceOf(User);
            expect(user instanceof mongoose.Model).toBe(true);
        });
    });
});