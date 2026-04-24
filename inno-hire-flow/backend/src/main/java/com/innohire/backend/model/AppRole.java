package com.innohire.backend.model;

public enum AppRole {
    HIRING_MANAGER("hiring-manager"),
    LOB_HEAD("lob-head"),
    TAG_MANAGER("tag-manager");

    private final String value;

    AppRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
