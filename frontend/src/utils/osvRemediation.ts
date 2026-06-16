import { sanitizePackageIdentifier, sanitizeVersionIdentifier } from './osvPackageSafety';

interface OsvVersionRange {
  introduced: string | null;
  fixed: string | null;
  hasFixedVersion: boolean;
}

export function parseOsvVersionRange(ranges: unknown): OsvVersionRange {
  let introduced: string | null = null;
  let fixed: string | null = null;

  if (Array.isArray(ranges)) {
    for (const range of ranges) {
      if (
        typeof range === 'object' &&
        range !== null &&
        'events' in range &&
        Array.isArray((range as { events: unknown }).events)
      ) {
        for (const event of (range as { events: Record<string, unknown>[] }).events) {
          if (event.introduced !== undefined) introduced = String(event.introduced);
          if (event.fixed !== undefined) fixed = String(event.fixed);
        }
      }
    }
  }

  return {
    introduced,
    fixed,
    hasFixedVersion: fixed !== null && fixed.trim() !== '',
  };
}

export function formatOsvVersionLabel(ver: string | null | undefined, fallback = 'Unknown'): string {
  if (!ver) return fallback;
  const clean = ver.trim();
  if (clean === '0') return 'Initial Release';
  if (/^[0-9a-fA-F]{40}$/.test(clean)) return clean;
  if (/^[a-zA-Z]/.test(clean) || clean.includes(':')) return clean;
  return `v${clean}`;
}

interface OsvRemediationGuide {
  brandName: string;
  badgeClass: string;
  guide: string;
  code: string;
  patchLabel: string;
}

export function buildOsvRemediationGuide(
  ecosystem: string | null | undefined,
  packageName: string | null | undefined,
  versionRange: OsvVersionRange,
  vulnId: string,
): OsvRemediationGuide {
  const safeEco = sanitizePackageIdentifier(ecosystem, 'Source Library');
  const safePkg = sanitizePackageIdentifier(packageName, 'package');
  const ecoLower = safeEco.toLowerCase();
  const isMalicious = /^MAL-/i.test(vulnId);
  const { hasFixedVersion, fixed } = versionRange;
  const safeFixed = hasFixedVersion ? sanitizeVersionIdentifier(fixed, '') : '';
  const displayVersion = hasFixedVersion && safeFixed ? formatOsvVersionLabel(safeFixed) : null;
  const patchLabel = displayVersion ?? 'Unpatched';

  const defaultBadge = 'border-neutral-500/20 bg-neutral-500/5 text-neutral-400';

  if (isMalicious) {
    if (ecoLower.includes('npm')) {
      return {
        brandName: 'npm',
        badgeClass: 'border-red-500/20 bg-red-500/5 text-red-400',
        guide: '이 패키지는 악성 코드로 분류되었습니다. 설치되어 있다면 즉시 제거하고 환경을 검사하세요.',
        code: `# Malicious package — do NOT install or upgrade\nnpm uninstall ${safePkg}\n\n# Audit dependencies\nnpm audit`,
        patchLabel: 'Remove Package',
      };
    }
    return {
      brandName: ecoLower.includes('pypi') || ecoLower.includes('pip') ? 'PyPI / Python' : safeEco,
      badgeClass: 'border-red-500/20 bg-red-500/5 text-red-400',
      guide: '이 패키지는 악성 코드로 분류되었습니다. 설치되어 있다면 즉시 제거하고 환경을 검사하세요.',
      code: `# Malicious package — do NOT install or upgrade\npip uninstall -y ${safePkg}\n\n# Audit the environment for other malicious packages\npip-audit`,
      patchLabel: 'Remove Package',
    };
  }

  if (ecoLower.includes('npm')) {
    if (!hasFixedVersion || !displayVersion) {
      return {
        brandName: 'npm',
        badgeClass: 'border-red-500/20 bg-red-500/5 text-red-400',
        guide: 'OSV advisory에 아직 패치 버전이 없습니다. 업스트림 공지를 확인한 뒤 안전한 버전이 확인되면 업데이트하세요.',
        code: `# No fixed version in OSV advisory yet\nnpm audit\n\n# When a patched release is published:\n# npm install ${safePkg}@<safe-version>`,
        patchLabel,
      };
    }
    return {
      brandName: 'npm',
      badgeClass: 'border-red-500/20 bg-red-500/5 text-red-400',
      guide: 'Node.js 패키지의 package.json 의존성 복구를 위해 아래 복구 명령을 복사하여 즉시 실행하세요.',
      code: `# 의존 패키지 보안 패치 버전 업데이트\nnpm install ${safePkg}@${displayVersion}\n\n# 또는 전체 취약점 오딧 자동 픽스 실행\nnpm audit fix`,
      patchLabel,
    };
  }

  if (ecoLower.includes('pypi') || ecoLower.includes('pip')) {
    if (!hasFixedVersion || !displayVersion) {
      return {
        brandName: 'PyPI / Python',
        badgeClass: 'border-sky-500/20 bg-sky-500/5 text-sky-400',
        guide: 'OSV advisory에 패치 버전이 아직 없습니다. 안전한 버전이 공개될 때까지 업그레이드하지 마세요.',
        code: `# No fixed version in OSV advisory yet\npip-audit\n\n# When a patched release is published:\n# pip install --upgrade ${safePkg}==<safe-version>`,
        patchLabel,
      };
    }
    return {
      brandName: 'PyPI / Python',
      badgeClass: 'border-sky-500/20 bg-sky-500/5 text-sky-400',
      guide: 'Python 의존 가상 환경(venv) 혹은 requirements.txt에 지정된 취약 종속성을 업데이트하세요.',
      code: `# 특정 패키지 보안 패치 버전 업그레이드\npip install --upgrade ${safePkg}==${displayVersion.replace(/^v/, '')}\n\n# 전체 의존성 취약 모듈 검사\npip-audit`,
      patchLabel,
    };
  }

  if (ecoLower.includes('debian') || ecoLower.includes('ubuntu') || ecoLower.includes('apt')) {
    if (!hasFixedVersion) {
      return {
        brandName: 'Debian / Ubuntu OS',
        badgeClass: defaultBadge,
        guide: 'OSV advisory에 고정(fixed) 버전이 아직 없습니다. 배포판 보안 공지가 나올 때까지 모니터링하세요.',
        code: `# No fixed version in OSV advisory yet\nsudo apt-get update\napt-cache policy ${safePkg}\n\n# After Debian/Ubuntu publishes a security update:\nsudo apt-get install --only-upgrade -y ${safePkg}`,
        patchLabel,
      };
    }
    return {
      brandName: 'Debian / Ubuntu OS',
      badgeClass: defaultBadge,
      guide: '리눅스 컨테이너 및 인프라 서버의 apt 패키지 저장소 색인을 갱신 후 타겟 라이브러리 업그레이드를 수행하십시오.',
      code: `# apt 패키지 업데이트 및 특정 패키지 보안 패치\nsudo apt-get update && sudo apt-get install --only-upgrade -y ${safePkg}`,
      patchLabel,
    };
  }

  if (ecoLower.includes('maven')) {
    const parts = safePkg.split(':');
    const groupId = parts[0] || 'groupId';
    const artifactId = parts[1] || safePkg;
    if (!hasFixedVersion || !displayVersion) {
      return {
        brandName: 'Maven / Java',
        badgeClass: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
        guide: 'OSV advisory에 패치 버전이 아직 없습니다. 벤더 공지를 확인하세요.',
        code: `# No fixed version in OSV advisory yet\n# mvn dependency:tree | grep ${artifactId}`,
        patchLabel,
      };
    }
    return {
      brandName: 'Maven / Java',
      badgeClass: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
      guide: 'Java Spring pom.xml 빌드 종속 패키지 버전을 아래 XML 코드로 수정 후 Maven 인스톨을 재실행 하세요.',
      code: `<!-- pom.xml 의존성 수정 안내 -->\n<dependency>\n  <groupId>${groupId}</groupId>\n  <artifactId>${artifactId}</artifactId>\n  <version>${displayVersion}</version>\n</dependency>`,
      patchLabel,
    };
  }

  if (ecoLower.includes('go')) {
    if (!hasFixedVersion || !displayVersion) {
      return {
        brandName: 'Go Modules',
        badgeClass: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
        guide: 'OSV advisory에 패치 버전이 아직 없습니다.',
        code: `# No fixed version in OSV advisory yet\ngo list -m ${safePkg}`,
        patchLabel,
      };
    }
    return {
      brandName: 'Go Modules',
      badgeClass: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
      guide: 'go.mod 모듈 캐시 정리 및 신규 보안 패치 버전을 취득해 go 프로젝트 컴파일 환경을 복구하세요.',
      code: `# Go 모듈 강제 타겟 업데이트\ngo get -u ${safePkg}@${displayVersion}\n\n# 모듈 정리 및 빌드 종속성 무결성 검증\ngo mod tidy`,
      patchLabel,
    };
  }

  if (!hasFixedVersion || !displayVersion) {
    return {
      brandName: safeEco,
      badgeClass: defaultBadge,
      guide: 'OSV advisory에 패치 버전이 아직 없습니다. 업스트림 공지를 확인하세요.',
      code: `# No fixed version in OSV advisory yet\n# Monitor ${safePkg} for vendor updates`,
      patchLabel,
    };
  }

  return {
    brandName: safeEco,
    badgeClass: defaultBadge,
    guide: `프로젝트 빌드 환경에 종속된 ${safeEco} 라이브러리를 안전한 패치 버전으로 업데이트해 조치하십시오.`,
    code: `# 권장 패치 타겟 버전\n${safePkg} -> ${displayVersion}`,
    patchLabel,
  };
}
