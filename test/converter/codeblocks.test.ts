import { convertCodeBlocks } from '../../src/converter/codeblocks';

describe('convertCodeBlocks', () => {
  it('converts a code block with a title', () => {
    const input = `{% code title="config.json" %}\n\`\`\`json\n{"key": "value"}\n\`\`\`\n{% endcode %}`;
    const result = convertCodeBlocks(input);
    expect(result).toContain('```json title="config.json"');
    expect(result).toContain('{"key": "value"}');
    expect(result).not.toContain('{% code');
    expect(result).not.toContain('{% endcode');
  });

  it('converts a code block without a title', () => {
    const input = `{% code %}\n\`\`\`bash\necho hello\n\`\`\`\n{% endcode %}`;
    const result = convertCodeBlocks(input);
    expect(result).toContain('```bash');
    expect(result).toContain('echo hello');
  });
});
