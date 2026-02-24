import { convertEmbeds } from '../../src/converter/embeds';
import { MigrationFlag } from '../../src/types';

describe('convertEmbeds', () => {
  it('converts embed to a markdown link and adds a review comment', () => {
    const flags: MigrationFlag[] = [];
    const input = `{% embed url="https://example.com/video" %}`;
    const result = convertEmbeds(input, flags);
    expect(result).toContain('[https://example.com/video](https://example.com/video)');
    expect(result).toContain('<!-- embed: manual review needed -->');
  });

  it('adds a flag for each embed found', () => {
    const flags: MigrationFlag[] = [];
    const input = `{% embed url="https://a.com" %}\n{% embed url="https://b.com" %}`;
    convertEmbeds(input, flags);
    expect(flags).toHaveLength(2);
    expect(flags[0].type).toBe('embed');
    expect(flags[1].type).toBe('embed');
  });
});
