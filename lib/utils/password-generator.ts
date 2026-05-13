/**
 * Genera una contraseña segura de 8-12 caracteres
 * Con al menos 1 número, 1 mayúscula y 1 carácter especial
 */
export function generateSecurePassword(): string {
  const numbers = "0123456789";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const special = "!@#$%^&*";

  const allChars = numbers + uppercase + lowercase + special;
  const length = Math.floor(Math.random() * 5) + 8; // 8-12 caracteres

  // Garantizar al menos 1 de cada tipo requerido
  const requiredChars = [
    numbers[Math.floor(Math.random() * numbers.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  // Rellenar el resto de la contraseña con caracteres aleatorios
  const remainingLength = length - requiredChars.length;
  for (let i = 0; i < remainingLength; i++) {
    requiredChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Mezclar los caracteres
  return requiredChars.sort(() => Math.random() - 0.5).join("");
}

/**
 * Valida que una contraseña cumpla con los requisitos mínimos
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8 || password.length > 12) {
    errors.push("La contraseña debe tener entre 8 y 12 caracteres");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una mayúscula");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("La contraseña debe contener al menos un carácter especial");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
