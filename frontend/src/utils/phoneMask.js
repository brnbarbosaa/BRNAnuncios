/**
 * Máscara de telefone brasileiro: (99) 99999-9999
 * Funciona tanto para celular (9 dígitos) quanto fixo (8 dígitos)
 */
export function maskPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        // Fixo: (XX) XXXX-XXXX
        return digits
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    // Celular: (XX) XXXXX-XXXX
    return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Retorna props prontas para um input de telefone com máscara
 */
export function phoneInputProps(value, onChange, extraStyle = {}) {
    return {
        value,
        onChange: (e) => onChange(maskPhone(e.target.value)),
        placeholder: '(11) 99999-9999',
        maxLength: 15,
        inputMode: 'numeric',
        className: 'form-input',
        style: extraStyle,
    };
}
