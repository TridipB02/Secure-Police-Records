package com.secure.policerecord.config;

import org.hyperledger.fabric.gateway.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

@Configuration
public class FabricConfig {

    @Value("${fabric.wallet-path}")
    private String walletPath;

    @Value("${fabric.network-config-path}")
    private String networkConfigPath;

    @Value("${fabric.msp-id}")
    private String mspId;

    @Bean
    public Wallet fabricWallet() throws IOException, CertificateException, InvalidKeyException {
        Wallet wallet = Wallets.newInMemoryWallet();

        Path certPath = Paths.get(walletPath, "admin-cert.pem");
        Path keyPath = Paths.get(walletPath, "admin-key.pem");

        X509Certificate certificate = Identities.readX509Certificate(
            Files.newBufferedReader(certPath));
        PrivateKey privateKey = Identities.readPrivateKey(
            Files.newBufferedReader(keyPath));

        wallet.put("admin", Identities.newX509Identity(mspId, certificate, privateKey));

        return wallet;
    }

    @Bean
    public Gateway fabricGateway(Wallet fabricWallet) throws IOException {
        Path networkConfigFile = Paths.get(networkConfigPath);

        return Gateway.createBuilder()
            .identity(fabricWallet, "admin")
            .networkConfig(networkConfigFile)
            .discovery(true)
            .connect();
    }
}