package com.code_canary.backend.security;

import com.code_canary.backend.config.TrustedProxyProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TrustedProxyMatcher {

    private final TrustedProxyProperties properties;
    private volatile List<CidrRange> cachedRanges;

    public boolean isTrustedProxy(String remoteAddr) {
        if (!StringUtils.hasText(remoteAddr)) {
            return false;
        }

        InetAddress address = parseAddress(remoteAddr.trim());
        if (address == null) {
            return false;
        }

        for (CidrRange range : getRanges()) {
            if (range.contains(address)) {
                return true;
            }
        }
        return false;
    }

    private List<CidrRange> getRanges() {
        List<CidrRange> ranges = cachedRanges;
        if (ranges == null) {
            synchronized (this) {
                ranges = cachedRanges;
                if (ranges == null) {
                    ranges = new ArrayList<>();
                    for (String cidr : properties.getCidrs()) {
                        if (!StringUtils.hasText(cidr)) {
                            continue;
                        }
                        CidrRange parsed = CidrRange.parse(cidr.trim());
                        if (parsed != null) {
                            ranges.add(parsed);
                        }
                    }
                    cachedRanges = List.copyOf(ranges);
                }
            }
        }
        return ranges;
    }

    private static InetAddress parseAddress(String value) {
        try {
            return InetAddress.getByName(value);
        } catch (UnknownHostException e) {
            return null;
        }
    }

    private record CidrRange(byte[] network, byte[] mask) {

        static CidrRange parse(String cidr) {
            String[] parts = cidr.split("/");
            if (parts.length != 2) {
                return null;
            }

            try {
                InetAddress address = InetAddress.getByName(parts[0].trim());
                int prefixLength = Integer.parseInt(parts[1].trim());
                byte[] addressBytes = address.getAddress();
                if (prefixLength < 0 || prefixLength > addressBytes.length * 8) {
                    return null;
                }

                byte[] mask = new byte[addressBytes.length];
                int bitsRemaining = prefixLength;
                for (int i = 0; i < mask.length; i++) {
                    int bits = Math.min(8, bitsRemaining);
                    mask[i] = (byte) (bits == 0 ? 0 : (0xFF << (8 - bits)));
                    bitsRemaining -= bits;
                }

                byte[] network = new byte[addressBytes.length];
                for (int i = 0; i < addressBytes.length; i++) {
                    network[i] = (byte) (addressBytes[i] & mask[i]);
                }
                return new CidrRange(network, mask);
            } catch (UnknownHostException | NumberFormatException e) {
                return null;
            }
        }

        boolean contains(InetAddress address) {
            byte[] addressBytes = address.getAddress();
            if (addressBytes.length != network.length) {
                return false;
            }

            for (int i = 0; i < network.length; i++) {
                if ((addressBytes[i] & mask[i]) != network[i]) {
                    return false;
                }
            }
            return true;
        }
    }
}
