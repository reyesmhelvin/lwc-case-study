public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountList() {
        return [
            SELECT Id, Name, Type, Industry
            FROM Account
            LIMIT 10
        ];
    }
}
