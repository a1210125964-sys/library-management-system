package com.lms.service;

import com.lms.dto.ConfigUpdateRequest;
import com.lms.model.SystemConfig;
import com.lms.repository.SystemConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SystemConfigService {

    public static final String BORROW_DAYS = "borrow_days";
    public static final String MAX_BORROW_COUNT = "max_borrow_count";
    public static final String OVERDUE_DAILY_FEE = "overdue_daily_fee";

    private final SystemConfigRepository systemConfigRepository;

    public SystemConfigService(SystemConfigRepository systemConfigRepository) {
        this.systemConfigRepository = systemConfigRepository;
    }

    @Transactional
    public void initDefaults(int borrowDays, int maxBorrowCount, double overdueDailyFee) {
        saveIfMissing(BORROW_DAYS, String.valueOf(borrowDays), "默认借阅天数");
        saveIfMissing(MAX_BORROW_COUNT, String.valueOf(maxBorrowCount), "最大可借数量");
        saveIfMissing(OVERDUE_DAILY_FEE, String.valueOf(overdueDailyFee), "每日逾期费用");
    }

    public Map<String, String> getAllAsMap() {
        List<SystemConfig> all = systemConfigRepository.findAll();
        Map<String, String> result = new HashMap<>();
        for (SystemConfig config : all) {
            result.put(config.getConfigKey(), config.getConfigValue());
        }
        return result;
    }

    @Transactional
    public Map<String, String> update(ConfigUpdateRequest req) {
        if (req.getBorrowDays() != null) {
            save(BORROW_DAYS, String.valueOf(req.getBorrowDays()), "默认借阅天数");
        }
        if (req.getMaxBorrowCount() != null) {
            save(MAX_BORROW_COUNT, String.valueOf(req.getMaxBorrowCount()), "最大可借数量");
        }
        if (req.getOverdueDailyFee() != null) {
            save(OVERDUE_DAILY_FEE, String.valueOf(req.getOverdueDailyFee()), "每日逾期费用");
        }
        return getAllAsMap();
    }

    public int borrowDays() {
        return Integer.parseInt(get(BORROW_DAYS, "30"));
    }

    public int maxBorrowCount() {
        return Integer.parseInt(get(MAX_BORROW_COUNT, "5"));
    }

    public double overdueDailyFee() {
        return Double.parseDouble(get(OVERDUE_DAILY_FEE, "1.0"));
    }

    private String get(String key, String defaultValue) {
        return systemConfigRepository.findByConfigKey(key)
            .map(SystemConfig::getConfigValue)
            .orElse(defaultValue);
    }

    private void saveIfMissing(String key, String value, String description) {
        if (systemConfigRepository.findByConfigKey(key).isEmpty()) {
            save(key, value, description);
        }
    }

    private void save(String key, String value, String description) {
        SystemConfig config = systemConfigRepository.findByConfigKey(key).orElseGet(SystemConfig::new);
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setDescription(description);
        systemConfigRepository.save(config);
    }
}
