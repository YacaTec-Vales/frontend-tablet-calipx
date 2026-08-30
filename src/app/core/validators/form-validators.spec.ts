import { describe, it, expect } from 'vitest';
import {
  required,
  validateName,
  validateEmail,
  validatePhone,
  validatePostalCode,
  validateCurp,
  validateRfc,
  validateClabe,
  validateFolioPrefix,
  validateUsername,
  validatePassword,
  validatePasswordsMatch,
  validateMfaCode,
  validateFolio,
  validateUuid,
  validateReason,
  validatePositiveAmount,
  validateBirthDate,
  validateCutDate,
  validateDateRange,
  validateBankName,
  validateDescription,
} from './form-validators';

describe('form-validators', () => {
  describe('required', () => {
    it('rechaza null, undefined, vacio y solo espacios', () => {
      expect(required(null, 'nombre')).toMatch(/obligatorio/);
      expect(required(undefined, 'nombre')).toMatch(/obligatorio/);
      expect(required('', 'nombre')).toMatch(/obligatorio/);
      expect(required('   ', 'nombre')).toMatch(/obligatorio/);
    });
    it('acepta texto con contenido', () => {
      expect(required('Ana', 'nombre')).toBe('');
    });
  });

  describe('validateName', () => {
    it('acepta nombres simples', () => {
      expect(validateName('Ana')).toBe('');
      expect(validateName('Maria Jose')).toBe('');
    });
    it('acepta acentos, ñ y mayusculas', () => {
      expect(validateName('Hérnández')).toBe('');
      expect(validateName('ÑAco')).toBe('');
    });
    it('acepta espacios, apostrofes y guiones entre palabras', () => {
      expect(validateName("O'Brien")).toBe('');
      expect(validateName('Ana Maria Lopez')).toBe('');
    });
    it('rechaza solo numeros', () => {
      expect(validateName('12345')).toMatch(/solo puede contener letras/);
    });
    it('rechaza mezcla letras + numeros', () => {
      expect(validateName('Juan123')).toMatch(/solo puede contener letras/);
    });
    it('rechaza simbolos', () => {
      expect(validateName('Ana@Maria')).toMatch(/solo puede contener letras/);
    });
    it('rechaza menos de 2 caracteres', () => {
      expect(validateName('A')).toMatch(/al menos 2 caracteres/);
    });
    it('rechaza mas de 100 caracteres', () => {
      expect(validateName('a'.repeat(101))).toMatch(/mas de 100 caracteres/);
    });
    it('rechaza vacio (campo obligatorio)', () => {
      expect(validateName('')).toMatch(/obligatorio/);
    });
  });

  describe('validateEmail', () => {
    it('acepta emails validos', () => {
      expect(validateEmail('user@example.com')).toBe('');
      expect(validateEmail('user.name+tag@sub.example.com')).toBe('');
    });
    it('rechaza emails mal formados', () => {
      expect(validateEmail('user@')).toMatch(/valido/);
      expect(validateEmail('@example.com')).toMatch(/valido/);
      expect(validateEmail('user.example.com')).toMatch(/valido/);
      expect(validateEmail('asdf')).toMatch(/valido/);
    });
    it('rechaza vacio', () => {
      expect(validateEmail('')).toMatch(/obligatorio/);
    });
  });

  describe('validatePhone', () => {
    it('acepta exactamente 10 digitos', () => {
      expect(validatePhone('5512345678')).toBe('');
      expect(validatePhone('55123456789')).toMatch(/10 digitos/);
      expect(validatePhone('55123abc78')).toMatch(/10 digitos/);
    });
    it('rechaza con guiones o espacios', () => {
      expect(validatePhone('55-1234-5678')).toMatch(/10 digitos/);
      expect(validatePhone('55 1234 5678')).toMatch(/10 digitos/);
    });
    it('rechaza vacio', () => {
      expect(validatePhone('')).toMatch(/obligatorio/);
    });
  });

  describe('validatePostalCode', () => {
    it('acepta 5 digitos', () => {
      expect(validatePostalCode('27000')).toBe('');
    });
    it('rechaza 4 o 6 digitos', () => {
      expect(validatePostalCode('2700')).toMatch(/5 digitos/);
      expect(validatePostalCode('270000')).toMatch(/5 digitos/);
    });
  });

  describe('validateCurp', () => {
    it('acepta CURPs validas (4 letras + 6 digitos + 6 alfanum + 1 letra + 1 digito)', () => {
      expect(validateCurp('LOHC900101HMCRPNL0')).toBe('');
      expect(validateCurp('AARA800101HDFABCZ1')).toBe('');
    });
    it('acepta lowercase (la valida convirtiendo a mayusculas)', () => {
      expect(validateCurp('lohc900101hmcrpnl0')).toBe('');
    });
    it('rechaza longitud incorrecta', () => {
      expect(validateCurp('LOHC900101')).toMatch(/18 caracteres/);
      expect(validateCurp('LOHC900101HMCRPNL09X')).toMatch(/18 caracteres/);
    });
    it('rechaza formato invalido', () => {
      expect(validateCurp('123456789012345678')).toMatch(/formato valido/);
    });
  });

  describe('validateRfc', () => {
    it('acepta RFC persona fisica (13 chars)', () => {
      expect(validateRfc('LOHC900101AAA')).toBe('');
    });
    it('acepta RFC moral (12 chars)', () => {
      expect(validateRfc('ABC900101ABC')).toBe('');
    });
    it('rechaza longitud incorrecta', () => {
      expect(validateRfc('LOHC900101')).toMatch(/12 caracteres/);
    });
    it('rechaza formato invalido', () => {
      expect(validateRfc('12345ABC67890')).toMatch(/formato valido/);
    });
  });

  describe('validateClabe', () => {
    it('acepta 18 digitos', () => {
      expect(validateClabe('012180015000000001')).toBe('');
    });
    it('rechaza 17 o 19 digitos', () => {
      expect(validateClabe('01218001500000001')).toMatch(/18 digitos/);
      expect(validateClabe('0121800150000000011')).toMatch(/18 digitos/);
    });
    it('rechaza letras', () => {
      expect(validateClabe('01218001500000000A')).toMatch(/18 digitos/);
    });
  });

  describe('validateFolioPrefix', () => {
    it('acepta 3 letras mayusculas', () => {
      expect(validateFolioPrefix('GDL')).toBe('');
      expect(validateFolioPrefix('CDMX')).toMatch(/3 letras/);
    });
  });

  describe('validateUsername', () => {
    it('acepta usernames validos', () => {
      expect(validateUsername('admin')).toBe('');
      expect(validateUsername('user.name_01')).toBe('');
    });
    it('rechaza mayusculas', () => {
      expect(validateUsername('Admin')).toMatch(/minusculas/);
    });
    it('rechaza longitud < 3', () => {
      expect(validateUsername('ab')).toMatch(/3 caracteres/);
    });
  });

  describe('validatePassword', () => {
    it('acepta passwords que cumplen la politica', () => {
      expect(validatePassword('Abcdefg1')).toBe('');
      expect(validatePassword('Hola1234')).toBe('');
    });
    it('rechaza muy corta', () => {
      expect(validatePassword('Abc12')).toMatch(/minimo 8/);
    });
    it('rechaza sin minuscula', () => {
      expect(validatePassword('ABCDEF12')).toMatch(/minuscula/);
    });
    it('rechaza sin mayuscula', () => {
      expect(validatePassword('abcdef12')).toMatch(/mayuscula/);
    });
    it('rechaza sin digito', () => {
      expect(validatePassword('Abcdefgh')).toMatch(/digito/);
    });
    it('con returnAll=true devuelve lista de motivos', () => {
      expect(validatePassword('Abcdefg1', true)).toBe('');
      expect(validatePassword('abc', true)).toMatch(/minimo/);
      expect(validatePassword('abcdefgh', true)).toMatch(/mayuscula/);
    });
  });

  describe('validatePasswordsMatch', () => {
    it('acepta contrasenas iguales', () => {
      expect(validatePasswordsMatch('Abc12345', 'Abc12345')).toBe('');
    });
    it('rechaza contrasenas distintas', () => {
      expect(validatePasswordsMatch('Abc12345', 'Abc12346')).toMatch(/coinciden/);
    });
    it('no falla si la primera esta vacia', () => {
      expect(validatePasswordsMatch('', 'Abc12345')).toBe('');
    });
  });

  describe('validateMfaCode', () => {
    it('acepta 6 digitos', () => {
      expect(validateMfaCode('123456')).toBe('');
    });
    it('rechaza menos o mas de 6', () => {
      expect(validateMfaCode('12345')).toMatch(/6 digitos/);
      expect(validateMfaCode('1234567')).toMatch(/6 digitos/);
    });
    it('rechaza letras', () => {
      expect(validateMfaCode('abc123')).toMatch(/6 digitos/);
    });
  });

  describe('validateFolio', () => {
    it('acepta formatos validos', () => {
      expect(validateFolio('SOL-12345')).toBe('');
      expect(validateFolio('DIG-0001')).toBe('');
      expect(validateFolio('PRE-12345678')).toBe('');
    });
    it('rechaza formatos invalidos', () => {
      expect(validateFolio('12345')).toMatch(/formato/);
      expect(validateFolio('SOL12345')).toMatch(/formato/);
      expect(validateFolio('sol-12345')).toMatch(/formato/);
    });
  });

  describe('validateUuid', () => {
    it('acepta UUID v1-5', () => {
      expect(
        validateUuid('131e27e2-aaa3-47b4-9e42-4523790fd124'),
      ).toBe('');
    });
    it('rechaza UUID mal formado', () => {
      expect(validateUuid('not-a-uuid')).toMatch(/UUID valido/);
    });
  });

  describe('validateReason', () => {
    it('acepta motivo valido', () => {
      expect(validateReason('El cliente no acredito')).toBe('');
    });
    it('rechaza muy corto (default min 10)', () => {
      expect(validateReason('corto')).toMatch(/al menos 10/);
    });
    it('acepta longitudes personalizadas', () => {
      expect(validateReason('ok 5', 3)).toBe('');
    });
  });

  describe('validatePositiveAmount', () => {
    it('acepta numeros positivos', () => {
      expect(validatePositiveAmount(100)).toBe('');
      expect(validatePositiveAmount('100.5')).toBe('');
    });
    it('rechaza cero o negativo', () => {
      expect(validatePositiveAmount(0)).toMatch(/mayor a cero/);
      expect(validatePositiveAmount(-1)).toMatch(/mayor a cero/);
    });
    it('rechaza NaN', () => {
      expect(validatePositiveAmount('abc')).toMatch(/numero valido/);
    });
  });

  describe('validateBirthDate', () => {
    it('acepta fecha con edad valida', () => {
      expect(validateBirthDate('1990-05-15')).toBe('');
    });
    it('rechaza fecha futura', () => {
      const futureYear = new Date().getFullYear() + 1;
      expect(validateBirthDate(`${futureYear}-01-01`)).toMatch(/futura/);
    });
    it('rechaza menor de edad', () => {
      const year = new Date().getFullYear() - 5;
      expect(validateBirthDate(`${year}-01-01`)).toMatch(/al menos 18/);
    });
    it('rechaza formato invalido', () => {
      expect(validateBirthDate('not-a-date')).toMatch(/formato valido/);
    });
  });

  describe('validateCutDate', () => {
    it('acepta fecha pasada', () => {
      expect(validateCutDate('2025-01-01')).toBe('');
    });
    it('rechaza fecha futura por defecto', () => {
      const futureYear = new Date().getFullYear() + 1;
      expect(validateCutDate(`${futureYear}-01-01`)).toMatch(/futura/);
    });
    it('permite fecha futura si allowFuture=true', () => {
      const futureYear = new Date().getFullYear() + 1;
      expect(validateCutDate(`${futureYear}-01-01`, 'fecha', true)).toBe('');
    });
  });

  describe('validateDateRange', () => {
    it('acepta rango valido', () => {
      expect(validateDateRange('2025-01-01', '2025-12-31')).toBe('');
    });
    it('rechaza fin < inicio', () => {
      expect(validateDateRange('2025-12-31', '2025-01-01')).toMatch(/anterior/);
    });
    it('no falla si alguna fecha esta vacia', () => {
      expect(validateDateRange('', '')).toBe('');
    });
  });

  describe('validateBankName', () => {
    it('acepta nombre valido', () => {
      expect(validateBankName('BBVA')).toBe('');
    });
    it('rechaza < 2 chars', () => {
      expect(validateBankName('X')).toMatch(/al menos 2/);
    });
  });

  describe('validateDescription', () => {
    it('acepta descripcion valida', () => {
      expect(validateDescription('Detalles de la discrepancia')).toBe('');
    });
    it('rechaza < 5 chars por default', () => {
      expect(validateDescription('ok')).toMatch(/al menos 5/);
    });
  });
});
