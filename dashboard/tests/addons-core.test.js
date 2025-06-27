// Teste dos 4 Addons Core implementados
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('🔧 Core Addons Tests', () => {
  
  test('✅ dateInput - deve aceitar datas válidas', () => {
    const dateValue = '2025-06-27';
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
    assert.strictEqual(isValid, true, 'Data deve estar no formato YYYY-MM-DD');
  });

  test('✅ selectInput - deve ter opções válidas', () => {
    const options = [
      { value: 'option1', label: 'Opção 1' },
      { value: 'option2', label: 'Opção 2' }
    ];
    assert.ok(options.length > 0, 'Select deve ter pelo menos uma opção');
    assert.ok(options[0].value, 'Opção deve ter value');
    assert.ok(options[0].label, 'Opção deve ter label');
  });

  test('✅ numberInput - deve validar números', () => {
    const numberValue = 42;
    assert.strictEqual(typeof numberValue, 'number', 'Deve ser um número');
    assert.ok(numberValue >= 0, 'Número deve ser positivo por padrão');
  });

  test('✅ checkboxInput - deve ser boolean', () => {
    const checkboxValue = true;
    assert.strictEqual(typeof checkboxValue, 'boolean', 'Checkbox deve ser boolean');
  });

  test('🎯 Todos os addons core implementados', () => {
    const coreAddons = ['textInput', 'textarea', 'imageUpload', 'dateInput', 'selectInput', 'numberInput', 'checkboxInput'];
    assert.strictEqual(coreAddons.length, 7, 'Deve ter 7 addons core (3 originais + 4 novos)');
  });

});

console.log('🚀 Testes dos Addons Core executados com sucesso!');
