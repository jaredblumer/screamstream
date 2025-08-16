import ReCAPTCHA from 'react-google-recaptcha';

type Props = {
  siteKey?: string;
  recaptchaRef: React.RefObject<ReCAPTCHA>;
  onToken: (token: string) => void;
};

export default function RecaptchaField({ siteKey, recaptchaRef, onToken }: Props) {
  if (!siteKey) return null;
  return (
    <div className="space-y-2 flex flex-col items-center">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={(token) => onToken(token || '')}
        onExpired={() => onToken('')}
        onError={() => onToken('')}
        theme="dark"
      />
    </div>
  );
}
