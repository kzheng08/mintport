# Configuration

Configure your application using a config file.

{% code title="config.json" %}
```json
{
  "apiKey": "your-api-key",
  "baseUrl": "https://api.example.com",
  "timeout": 5000
}
```
{% endcode %}

## Environment Variables

{% accordion title="Required Variables" %}
- `API_KEY` — Your API key from the dashboard
- `BASE_URL` — The base URL for API requests
{% endaccordion %}

{% hint style="danger" %}
Never commit your API key to version control!
{% endhint %}
