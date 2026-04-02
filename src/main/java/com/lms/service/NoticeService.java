package com.lms.service;

import com.lms.dto.NoticeRequest;
import com.lms.exception.BusinessException;
import com.lms.model.Notice;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.repository.NoticeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public NoticeService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    @Transactional
    public Notice create(NoticeRequest req, User adminUser) {
        validateAdmin(adminUser);

        Notice notice = new Notice();
        notice.setTitle(req.getTitle());
        notice.setSummary(req.getSummary());
        notice.setContent(req.getContent());

        boolean published = Boolean.TRUE.equals(req.getPublished());
        notice.setPublished(published);
        notice.setPublishedAt(published ? LocalDateTime.now() : null);

        LocalDateTime now = LocalDateTime.now();
        notice.setCreatedAt(now);
        notice.setUpdatedAt(now);
        return noticeRepository.save(notice);
    }

    @Transactional
    public Notice update(Long id, NoticeRequest req, User adminUser) {
        validateAdmin(adminUser);

        Notice notice = noticeRepository.findById(id).orElseThrow(() -> new BusinessException("公告不存在"));
        notice.setTitle(req.getTitle());
        notice.setSummary(req.getSummary());
        notice.setContent(req.getContent());

        boolean published = Boolean.TRUE.equals(req.getPublished());
        notice.setPublished(published);
        if (!published) {
            notice.setPublishedAt(null);
        } else if (notice.getPublishedAt() == null) {
            notice.setPublishedAt(LocalDateTime.now());
        }

        notice.setUpdatedAt(LocalDateTime.now());
        return noticeRepository.save(notice);
    }

    @Transactional
    public void delete(Long id, User adminUser) {
        validateAdmin(adminUser);

        Notice notice = noticeRepository.findById(id).orElseThrow(() -> new BusinessException("公告不存在"));
        noticeRepository.delete(notice);
    }

    public Page<Notice> listAll(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return noticeRepository.findAll(pageable);
    }

    public Page<Notice> listPublished(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        return noticeRepository.findByPublishedTrue(pageable);
    }

    public Notice getPublishedDetail(Long id) {
        Notice notice = noticeRepository.findById(id).orElseThrow(() -> new BusinessException("公告不存在"));
        if (!Boolean.TRUE.equals(notice.getPublished())) {
            throw new BusinessException("公告不存在");
        }
        return notice;
    }

    public long countPublished() {
        return noticeRepository.countByPublishedTrue();
    }

    private void validateAdmin(User adminUser) {
        if (adminUser == null) {
            throw new BusinessException("管理员不存在");
        }
        if (adminUser.getRole() != UserRole.ADMIN) {
            throw new BusinessException("仅管理员可执行此操作");
        }
    }
}