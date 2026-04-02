interface TeamLogoProps {
  logoUrl?: string;
  teamName: string;
  size?: number;
}

export function TeamLogo({ logoUrl, teamName, size = 40 }: TeamLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={teamName}
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        background: '#2563eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: size * 0.4,
        fontWeight: 'bold',
      }}
    >
      {teamName.charAt(0).toUpperCase()}
    </div>
  );
}
