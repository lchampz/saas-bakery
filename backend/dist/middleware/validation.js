import { body, validationResult } from 'express-validator';
export const validateAuth = [
    body('email')
        .isEmail()
        .withMessage('E-mail deve ter um formato válido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
];
export const validateProduct = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Nome deve ter entre 1 e 100 caracteres'),
    body('quantity')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Quantidade deve ser um número positivo'),
];
export const validateRecipe = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Nome deve ter entre 1 e 100 caracteres'),
    body('ingredients')
        .isArray({ min: 1 })
        .withMessage('Receita deve ter pelo menos um ingrediente'),
    body('ingredients.*.productId')
        .isUUID()
        .withMessage('ID do produto deve ser válido'),
    body('ingredients.*.amount')
        .isFloat({ min: 0.01 })
        .withMessage('Quantidade do ingrediente deve ser maior que zero'),
];
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }
    return next();
};
