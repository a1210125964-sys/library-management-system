package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.dto.UpdateProfileRequest;
import com.lms.model.BorrowRecord;
import com.lms.model.OverdueRecord;
import com.lms.model.User;
import com.lms.service.AuthService;
import com.lms.service.BorrowService;
import com.lms.service.NoticeService;
import com.lms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserPortalController {

    private final AuthService authService;
    private final BorrowService borrowService;
    private final NoticeService noticeService;
    private final UserService userService;

    public UserPortalController(AuthService authService,
                                BorrowService borrowService,
                                NoticeService noticeService,
                                UserService userService) {
        this.authService = authService;
        this.borrowService = borrowService;
        this.noticeService = noticeService;
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);

        Map<String, Object> data = new HashMap<>();
        data.put("activeBorrowCount", borrowService.countActiveByUser(user.getId()));
        data.put("overdueCount", borrowService.countOverdueByUser(user.getId()));
        data.put("publishedNoticeCount", noticeService.countPublished());

        return ApiResponse.success("查询成功", data);
    }

    @GetMapping("/borrowings")
    public ApiResponse<List<Map<String, Object>>> borrowings(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);
        List<Map<String, Object>> data = borrowService.myRecords(user).stream().map(this::recordMap).collect(Collectors.toList());
        return ApiResponse.success("查询成功", data);
    }

    @GetMapping("/history")
    public ApiResponse<List<Map<String, Object>>> history(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);
        List<Map<String, Object>> data = borrowService.myHistory(user).stream().map(this::recordMap).collect(Collectors.toList());
        return ApiResponse.success("查询成功", data);
    }

    @GetMapping("/fines")
    public ApiResponse<Map<String, Object>> fines(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);
        List<Map<String, Object>> records = borrowService.myOverdueRecords(user).stream().map(this::overdueMap).collect(Collectors.toList());
        BigDecimal total = records.stream()
            .map(item -> (BigDecimal) item.get("overdueFee"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> data = new HashMap<>();
        data.put("totalFine", total);
        data.put("records", records);
        return ApiResponse.success("查询成功", data);
    }

    @GetMapping("/profile")
    public ApiResponse<Map<String, Object>> profile(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);
        return ApiResponse.success("查询成功", userMap(user));
    }

    @PutMapping("/profile")
    public ApiResponse<Map<String, Object>> updateProfile(@RequestHeader("X-Token") String token,
                                                           @Valid @RequestBody UpdateProfileRequest req) {
        User user = authService.requireUser(token);
        User updated = userService.updateProfile(user, req);
        return ApiResponse.success("更新成功", userMap(updated));
    }

    private Map<String, Object> recordMap(BorrowRecord record) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", record.getId());
        map.put("bookId", record.getBook().getId());
        map.put("bookTitle", record.getBook().getTitle());
        map.put("borrowTime", record.getBorrowTime());
        map.put("dueTime", record.getDueTime());
        map.put("returnTime", record.getReturnTime());
        map.put("status", record.getStatus());
        map.put("renewCount", record.getRenewCount());
        map.put("overdueFee", record.getOverdueFee());
        return map;
    }

    private Map<String, Object> overdueMap(OverdueRecord record) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", record.getId());
        map.put("borrowRecordId", record.getBorrowRecord().getId());
        map.put("bookId", record.getBook().getId());
        map.put("bookTitle", record.getBook().getTitle());
        map.put("overdueDays", record.getOverdueDays());
        map.put("overdueFee", record.getOverdueFee());
        map.put("createdAt", record.getCreatedAt());
        return map;
    }

    private Map<String, Object> userMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("realName", user.getRealName());
        map.put("phone", user.getPhone());
        map.put("idCard", user.getIdCard());
        map.put("role", user.getRole());
        return map;
    }
}
